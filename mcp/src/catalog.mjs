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

function tomlString(value) {
  const trimmed = value.trim();
  if (trimmed.startsWith('"')) return JSON.parse(trimmed);
  if (trimmed.startsWith("'")) return trimmed.slice(1, -1);
  return null;
}

function configEntries(config) {
  const plugins = new Map(), skills = [];
  let section = null, current = null;
  for (const raw of config.split(/\r?\n/)) {
    const line = raw.replace(/\s+#.*$/, "").trim();
    const plugin = line.match(/^\[plugins\.((?:"(?:\\.|[^"])+")|(?:'[^']+'))\]$/);
    if (plugin) {
      try { current = tomlString(plugin[1]); } catch { current = null; }
      section = current ? "plugin" : null;
      if (current && !plugins.has(current)) plugins.set(current, { enabled: null });
      else if (current) plugins.get(current).duplicate = true;
      continue;
    }
    if (line === "[[skills.config]]") { section = "skill"; current = {}; skills.push(current); continue; }
    if (line.startsWith("[")) { section = null; current = null; continue; }
    const pair = line.match(/^([A-Za-z0-9_.-]+)\s*=\s*(.+)$/);
    if (!pair || !current) continue;
    if (section === "plugin" && pair[1] === "enabled") plugins.get(current).enabled = pair[2] === "true";
    if (section === "skill" && ["enabled", "path"].includes(pair[1]))
      current[pair[1]] = pair[1] === "enabled" ? pair[2] === "true" : tomlString(pair[2]);
  }
  return { plugins, skills };
}

async function skillFiles(root, errors = []) {
  const found = [];
  async function walk(directory) {
    for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
      if (entry.isSymbolicLink()) {
        if (entry.name === "SKILL.md") errors.push({ path: path.join(directory, entry.name), message: "symlink skill rejected" });
        continue;
      }
      if (entry.name === ".git" || entry.name === "node_modules") continue;
      const filename = path.join(directory, entry.name);
      if (entry.isDirectory()) await walk(filename);
      else if (entry.isFile() && entry.name === "SKILL.md") found.push(filename);
    }
  }
  await walk(root);
  return found;
}

function semver(value) {
  const match = value.match(/^(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/);
  return match ? match.slice(1, 4).map(Number) : null;
}

function compareVersion(a, b) {
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] - b[i];
  return 0;
}

async function frontmatter(filename) {
  const file = await fs.open(filename, "r");
  let text;
  try {
    const buffer = Buffer.alloc(64 * 1024);
    const { bytesRead } = await file.read(buffer, 0, buffer.length, 0);
    text = new TextDecoder("utf-8", { fatal: true }).decode(buffer.subarray(0, bytesRead));
  } catch {
    throw new CatalogError("INVALID_SKILL_METADATA", "SKILL.md frontmatter is not valid UTF-8.");
  } finally {
    await file.close();
  }
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) throw new CatalogError("INVALID_SKILL_METADATA", "SKILL.md frontmatter is missing.");
  const values = {};
  for (const line of match[1].split(/\r?\n/)) {
    const pair = line.match(/^(name|description):\s*(.+)$/);
    if (!pair) continue;
    values[pair[1]] = pair[2].replace(/^['"]|['"]$/g, "");
  }
  if (!values.name || !values.description) throw new CatalogError("INVALID_SKILL_METADATA", "SKILL.md frontmatter is incomplete.");
  return values;
}

// Read the configured enabled cache directly. This avoids starting Codex app-server,
// whose startup may perform a marketplace refresh before returning skills/list.
export async function fetchConfiguredCatalog(
  cwd,
  { profileRoot = (() => {
    if (process.env.CODEX_HOME) return process.env.CODEX_HOME;
    const root = process.env.USERPROFILE || process.env.HOME;
    return root && path.join(root, ".codex");
  })() } = {},
) {
  const directory = await projectDirectory(cwd);
  const errors = [];
  const skills = [], seenPlugins = new Set();
  const profileDirectory = path.resolve(profileRoot);
  const seen = new Set();
  const add = async (filename, scope, pluginId) => {
    const stat = await fs.lstat(filename);
    if (!stat.isFile() || stat.isSymbolicLink())
      throw new CatalogError("UNSAFE_SKILL_FILE", "SKILL.md must be a regular file, not a file symlink.");
    const resolved = await fs.realpath(filename);
    if (seen.has(resolved)) return;
    seen.add(resolved);
    const metadata = await frontmatter(resolved);
    skills.push({ name: metadata.name, description: metadata.description, enabled: true,
      path: resolved, scope, pluginId });
  };
  const repoSkills = path.join(directory, ".agents", "skills");
  try {
    const discovered = [];
    for (const filename of await skillFiles(repoSkills, discovered)) {
      try { await add(filename, "repo", null); } catch (error) { discovered.push({ path: filename, message: error.message }); }
    }
    errors.push(...discovered);
  } catch (error) {
    if (error.code !== "ENOENT") errors.push({ path: repoSkills, message: "repo skills unavailable" });
  }
  let config;
  try {
    config = await fs.readFile(path.join(profileRoot, "config.toml"), "utf8");
  } catch {
    errors.push({ path: "config.toml", message: "Codex config unavailable" });
    config = "";
  }
  const entries = configEntries(config);
  for (const [pluginId, setting] of entries.plugins) {
    if (setting.duplicate) { errors.push({ path: pluginId, message: "duplicate plugin configuration" }); continue; }
    if (setting.enabled !== true) continue;
    const parts = pluginId.split("@");
    const [plugin, marketplace] = parts;
    if (parts.length !== 2 || !plugin || !marketplace || !/^[A-Za-z0-9._-]+$/.test(plugin) || !/^[A-Za-z0-9._-]+$/.test(marketplace)) {
      errors.push({ path: pluginId, message: "invalid plugin identifier" });
      continue;
    }
    if (seenPlugins.has(pluginId)) continue;
    seenPlugins.add(pluginId);
    const root = path.join(profileRoot, "plugins", "cache", marketplace, plugin);
    if (!path.resolve(root).startsWith(profileDirectory + path.sep)) {
      errors.push({ path: root, message: "plugin cache escapes profile" });
      continue;
    }
    try {
      const versions = (await fs.readdir(root, { withFileTypes: true }))
        .filter((entry) => entry.isDirectory() && !entry.isSymbolicLink())
        .map((entry) => ({ name: entry.name, version: semver(entry.name) }))
        .filter((entry) => entry.version).sort((a, b) => compareVersion(b.version, a.version));
      if (!versions.length) throw new Error("no valid semver cache");
      const versionRoot = path.join(root, versions[0].name);
      const manifestPath = path.join(versionRoot, ".codex-plugin", "plugin.json");
      const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
      if (manifest.name !== plugin) throw new Error("plugin manifest mismatch");
      if (typeof manifest.skills !== "string") continue;
      if (manifest.version != null && manifest.version !== versions[0].name) throw new Error("plugin manifest version mismatch");
      const skillRoot = path.resolve(versionRoot, manifest.skills);
      if (!skillRoot.startsWith(path.resolve(versionRoot) + path.sep)) throw new Error("plugin skill root escapes cache");
      const discovered = [];
      for (const filename of await skillFiles(skillRoot, discovered)) {
        try { await add(filename, "user", pluginId); } catch (error) { discovered.push({ path: filename, message: error.message }); }
      }
      errors.push(...discovered);
    } catch {
      errors.push({ path: root, message: "enabled plugin cache unavailable" });
    }
  }
  for (const entry of entries.skills) {
    if (entry.enabled !== true || typeof entry.path !== "string" || !path.isAbsolute(entry.path)) continue;
    try { await add(entry.path, "user", null); }
    catch { errors.push({ path: entry.path, message: "configured skill unavailable" }); }
  }
  skills.sort((a, b) => a.path.localeCompare(b.path));
  return { data: [{ cwd: directory, skills, errors }] };
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
