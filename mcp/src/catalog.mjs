import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { constants } from "node:fs";
import * as fs from "node:fs/promises";
import path from "node:path";
import { createInterface } from "node:readline";

export const sha256 = (value) =>
  createHash("sha256").update(value).digest("hex");
export class CatalogError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

export async function projectDirectory(cwd) {
  if (typeof cwd !== "string" || !path.isAbsolute(cwd) || cwd.includes("\0"))
    throw new CatalogError(
      "INVALID_CWD",
      "cwd must be an existing absolute project directory.",
    );
  try {
    if (!(await fs.stat(cwd)).isDirectory()) throw new Error();
    return await fs.realpath(cwd);
  } catch {
    throw new CatalogError(
      "INVALID_CWD",
      "cwd must be an existing absolute project directory.",
    );
  }
}

// This calls the native catalogue, not a filesystem scan of cached plugin versions.
export async function fetchNativeCatalog(
  cwd,
  {
    signal,
    command = process.env.FABLE5_CODEX_BIN || "codex",
    args = ["app-server", "--stdio"],
    timeoutMs = 15_000,
    maxBytes = 8 * 1024 * 1024,
  } = {},
) {
  const directory = await projectDirectory(cwd);
  return new Promise((resolve, reject) => {
    let finished = false,
      received = 0;
    const child = spawn(command, args, {
      cwd: directory,
      shell: false,
      windowsHide: true,
      stdio: ["pipe", "pipe", "ignore"],
    });
    const lines = createInterface({ input: child.stdout, crlfDelay: Infinity });
    const finish = (error, result) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      signal?.removeEventListener("abort", abort);
      lines.close();
      child.stdin.destroy();
      child.kill();
      error ? reject(error) : resolve(result);
    };
    const abort = () =>
      finish(new CatalogError("CANCELLED", "Catalogue request was cancelled."));
    const timer = setTimeout(
      () =>
        finish(
          new CatalogError("CATALOG_TIMEOUT", "Codex catalogue timed out."),
        ),
      timeoutMs,
    );
    const send = (message) => {
      if (!finished) child.stdin.write(JSON.stringify(message) + "\n");
    };
    child.on("error", () =>
      finish(
        new CatalogError(
          "CODEX_UNAVAILABLE",
          "Cannot start Codex CLI. Check PATH or FABLE5_CODEX_BIN.",
        ),
      ),
    );
    child.stdin.on("error", () =>
      finish(
        new CatalogError(
          "CATALOG_UNAVAILABLE",
          "Codex catalogue connection closed.",
        ),
      ),
    );
    child.on("exit", () =>
      finish(
        new CatalogError(
          "CATALOG_UNAVAILABLE",
          "Codex exited before returning its catalogue.",
        ),
      ),
    );
    child.stdout.prependListener("data", (data) => {
      received += data.length;
      if (received > maxBytes)
        finish(
          new CatalogError(
            "CATALOG_TOO_LARGE",
            "Codex catalogue exceeds the output limit.",
          ),
        );
    });
    lines.on("line", (line) => {
      if (finished || !line.trim()) return;
      let message;
      try {
        message = JSON.parse(line);
      } catch {
        finish(
          new CatalogError("INVALID_CATALOG", "Codex returned invalid JSON."),
        );
        return;
      }
      if (message.id !== 1 && message.id !== 2) return;
      if (message.error) {
        finish(
          new CatalogError(
            "CATALOG_UNAVAILABLE",
            "Codex rejected the catalogue request.",
          ),
        );
        return;
      }
      if (message.id === 1) {
        send({ method: "initialized", params: {} });
        send({
          id: 2,
          method: "skills/list",
          params: { cwds: [directory], forceReload: true },
        });
      } else finish(null, message.result);
    });
    signal?.addEventListener("abort", abort, { once: true });
    if (signal?.aborted) {
      abort();
      return;
    }
    send({
      id: 1,
      method: "initialize",
      params: {
        clientInfo: { name: "fable5-skill-search", version: "0.1.0" },
        capabilities: { experimentalApi: true },
      },
    });
  });
}

export function parseCatalog(response, cwd) {
  const fail = () => {
    throw new CatalogError(
      "INVALID_CATALOG",
      "Codex returned an unsupported catalogue shape.",
    );
  };
  if (!Array.isArray(response?.data)) fail();
  const entries = response.data.filter(
    (entry) =>
      typeof entry?.cwd === "string" &&
      path.resolve(entry.cwd) === path.resolve(cwd),
  );
  if (entries.length !== 1) fail();
  const entry = entries[0];
  if (!Array.isArray(entry.skills) || !Array.isArray(entry.errors)) fail();
  const skills = new Map();
  for (const skill of entry.skills) {
    if (
      !skill ||
      typeof skill.enabled !== "boolean" ||
      typeof skill.name !== "string" ||
      typeof skill.description !== "string" ||
      typeof skill.path !== "string" ||
      !path.isAbsolute(skill.path) ||
      path.basename(skill.path) !== "SKILL.md" ||
      !["user", "repo", "system", "admin"].includes(skill.scope) ||
      (skill.pluginId != null && typeof skill.pluginId !== "string")
    )
      fail();
    if (!skill.enabled) continue;
    const filename = path.resolve(skill.path);
    const id = sha256(
      process.platform === "win32" ? filename.toLowerCase() : filename,
    );
    skills.set(id, {
      id,
      name: skill.name,
      description: skill.description,
      path: filename,
      scope: skill.scope,
      plugin_id: skill.pluginId ?? null,
    });
  }
  return {
    skills: [...skills.values()],
    partial: entry.errors.length > 0,
    warning_count: entry.errors.length,
  };
}

export async function readRegisteredSkill(catalog, id, offset, limit) {
  const skill = catalog.skills.find((item) => item.id === id);
  if (!skill)
    throw new CatalogError(
      catalog.partial ? "CATALOG_INCOMPLETE" : "SKILL_NOT_FOUND",
      "The skill is absent, disabled, or not visible in this project catalogue.",
    );
  const maxBytes = 1024 * 1024;
  let file;
  try {
    const before = await fs.lstat(skill.path);
    if (!before.isFile() || before.isSymbolicLink())
      throw new CatalogError(
        "UNSAFE_SKILL_FILE",
        "SKILL.md must be a regular file, not a file symlink.",
      );
    if (before.size > maxBytes)
      throw new CatalogError("SKILL_TOO_LARGE", "SKILL.md exceeds 1 MiB.");
    file = await fs.open(
      skill.path,
      constants.O_RDONLY | (constants.O_NOFOLLOW || 0),
    );
    const opened = await file.stat();
    if (
      !opened.isFile() ||
      opened.ino !== before.ino ||
      opened.dev !== before.dev
    )
      throw new CatalogError(
        "SKILL_CHANGED",
        "SKILL.md changed while opening it.",
      );
    const buffer = Buffer.alloc(maxBytes + 1);
    let size = 0;
    while (size < buffer.length) {
      const { bytesRead } = await file.read(
        buffer,
        size,
        buffer.length - size,
        null,
      );
      if (!bytesRead) break;
      size += bytesRead;
    }
    if (size > maxBytes)
      throw new CatalogError("SKILL_TOO_LARGE", "SKILL.md exceeds 1 MiB.");
    const after = await fs.lstat(skill.path);
    const current = await file.stat();
    if (
      after.isSymbolicLink() ||
      after.ino !== opened.ino ||
      after.dev !== opened.dev ||
      current.size !== opened.size ||
      current.mtimeMs !== opened.mtimeMs
    )
      throw new CatalogError(
        "SKILL_CHANGED",
        "SKILL.md changed while reading it; retry.",
      );
    const bytes = buffer.subarray(0, size);
    let text;
    try {
      text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    } catch {
      throw new CatalogError(
        "INVALID_SKILL_TEXT",
        "SKILL.md is not valid UTF-8.",
      );
    }
    if (text.includes("\0"))
      throw new CatalogError(
        "INVALID_SKILL_TEXT",
        "SKILL.md contains binary data.",
      );
    const chars = Array.from(text);
    if (offset > chars.length)
      throw new CatalogError(
        "INVALID_OFFSET",
        "offset exceeds the skill text length.",
      );
    return {
      skill,
      content: chars.slice(offset, offset + limit).join(""),
      offset,
      total_chars: chars.length,
      next_offset: offset + limit < chars.length ? offset + limit : null,
      sha256: sha256(bytes),
      partial: catalog.partial,
      warning_count: catalog.warning_count,
    };
  } catch (error) {
    if (error instanceof CatalogError) throw error;
    throw new CatalogError(
      "SKILL_UNREADABLE",
      "Registered SKILL.md could not be read. Refresh search or check file access.",
    );
  } finally {
    await file?.close();
  }
}
