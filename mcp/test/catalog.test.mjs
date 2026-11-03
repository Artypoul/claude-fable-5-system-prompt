import assert from "node:assert/strict";
import { test } from "node:test";
import * as fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  fetchNativeCatalog,
  parseCatalog,
  readRegisteredSkill,
  projectDirectory,
  sha256,
} from "../src/catalog.mjs";

const fixtures = fileURLToPath(new URL("./fixtures/", import.meta.url));
const cwd = await fs.realpath(process.cwd());
const response = (skillPath) => ({
  data: [
    {
      cwd,
      errors: [],
      skills: [
        {
          name: "pdf",
          description: "Create PDF documents",
          enabled: true,
          path: skillPath,
          scope: "user",
          pluginId: "docs@test",
        },
      ],
    },
  ],
});

test("redacted response captured from the actual Codex catalogue remains compatible", async () => {
  const data = JSON.parse(
    await fs.readFile(path.join(fixtures, "native-catalog.json"), "utf8"),
  );
  data.data[0].cwd = cwd;
  for (const [index, skill] of data.data[0].skills.entries())
    skill.path = path.join(cwd, String(index), "SKILL.md");
  assert.equal(parseCatalog(data, cwd).skills.length, 2);
});

test("native catalogue contract: active entries only, no name-based deduplication", () => {
  const data = response(path.join(cwd, "a", "SKILL.md"));
  data.data[0].skills.push({
    ...data.data[0].skills[0],
    path: path.join(cwd, "b", "SKILL.md"),
  });
  data.data[0].skills.push({
    ...data.data[0].skills[0],
    enabled: false,
    path: path.join(cwd, "old", "SKILL.md"),
  });
  const parsed = parseCatalog(data, cwd);
  assert.equal(parsed.skills.length, 2);
  assert.notEqual(parsed.skills[0].id, parsed.skills[1].id);
  assert.equal(parsed.partial, false);
  data.data[0].errors.push({ path: "redacted", message: "invalid skill" });
  assert.equal(parseCatalog(data, cwd).partial, true);
});

test("missing/unknown contract fields and wrong project cannot become an empty catalogue", () => {
  for (const data of [
    {},
    { data: [] },
    { data: [{ cwd: "/wrong", skills: [], errors: [] }] },
    { data: [{ cwd, skills: [], errors: null }] },
  ])
    assert.throws(() => parseCatalog(data, cwd), { code: "INVALID_CATALOG" });
  const data = response(path.join(cwd, "SKILL.md"));
  delete data.data[0].skills[0].enabled;
  assert.throws(() => parseCatalog(data, cwd), { code: "INVALID_CATALOG" });
});

test("only existing absolute directories are accepted", async () => {
  for (const value of [".", "", null, path.join(cwd, "missing-directory")])
    await assert.rejects(projectDirectory(value), { code: "INVALID_CWD" });
  assert.equal(await projectDirectory(cwd), cwd);
});

test("read registered text in Unicode code points and bind complete content digest", async (t) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "fable5-read-"));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const filename = path.join(directory, "SKILL.md");
  const content = "# Пример 😀\nRead me.";
  await fs.writeFile(filename, content);
  const catalog = parseCatalog(response(filename), cwd);
  const id = catalog.skills[0].id;
  const first = await readRegisteredSkill(catalog, id, 0, 10);
  const rest = await readRegisteredSkill(catalog, id, first.next_offset, 32000);
  assert.equal(first.content + rest.content, content);
  assert.equal(first.sha256, sha256(Buffer.from(content)));
  await assert.rejects(readRegisteredSkill(catalog, id, 9999, 10), {
    code: "INVALID_OFFSET",
  });
  await assert.rejects(readRegisteredSkill(catalog, "0".repeat(64), 0, 10), {
    code: "SKILL_NOT_FOUND",
  });
  await assert.rejects(
    readRegisteredSkill({ ...catalog, skills: [] }, id, 0, 10),
    { code: "SKILL_NOT_FOUND" },
  );
});

test("unreadable, binary, oversized and file-symlink skill inputs are rejected", async (t) => {
  const directory = await fs.mkdtemp(
    path.join(os.tmpdir(), "fable5-bad-read-"),
  );
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const filename = path.join(directory, "SKILL.md");
  const catalog = parseCatalog(response(filename), cwd),
    id = catalog.skills[0].id;
  await assert.rejects(readRegisteredSkill(catalog, id, 0, 10), {
    code: "SKILL_UNREADABLE",
  });
  for (const bytes of [Buffer.from([255, 254]), Buffer.from("text\0binary")]) {
    await fs.writeFile(filename, bytes);
    await assert.rejects(readRegisteredSkill(catalog, id, 0, 10), {
      code: "INVALID_SKILL_TEXT",
    });
  }
  await fs.writeFile(filename, Buffer.alloc(1024 * 1024 + 1, 65));
  await assert.rejects(readRegisteredSkill(catalog, id, 0, 10), {
    code: "SKILL_TOO_LARGE",
  });
  // Windows can deny creating symlinks without Developer Mode; Linux CI exercises this boundary.
  await fs.unlink(filename);
  const target = path.join(directory, "private.txt");
  await fs.writeFile(target, "must not be returned");
  try {
    await fs.symlink(target, filename);
  } catch (error) {
    if (error.code !== "EPERM") throw error;
    t.diagnostic(
      "File-symlink check requires Developer Mode on Windows; Linux CI exercises it.",
    );
    return;
  }
  await assert.rejects(readRegisteredSkill(catalog, id, 0, 10), {
    code: "UNSAFE_SKILL_FILE",
  });
});

test("native JSON-RPC transport: success, source error, bad JSON, timeout, cancellation and output cap", async () => {
  const run = (mode, options = {}) =>
    fetchNativeCatalog(cwd, {
      command: process.execPath,
      args: [path.join(fixtures, "mock-codex.mjs"), mode],
      ...options,
    });
  assert.deepEqual(await run("ok"), {
    data: [{ cwd, skills: [], errors: [] }],
  });
  await assert.rejects(run("bad-json"), { code: "INVALID_CATALOG" });
  await assert.rejects(run("error"), { code: "CATALOG_UNAVAILABLE" });
  await assert.rejects(run("timeout", { timeoutMs: 100 }), {
    code: "CATALOG_TIMEOUT",
  });
  await assert.rejects(run("large", { maxBytes: 1000 }), {
    code: "CATALOG_TOO_LARGE",
  });
  await assert.rejects(run("timeout", { signal: AbortSignal.timeout(100) }), {
    code: "CANCELLED",
  });
  await assert.rejects(run("timeout", { signal: AbortSignal.abort() }), {
    code: "CANCELLED",
  });
  await assert.rejects(
    fetchNativeCatalog(cwd, { command: path.join(cwd, "no-codex-binary") }),
    { code: "CODEX_UNAVAILABLE" },
  );
});
