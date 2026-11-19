import test from "node:test";
import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fetchConfiguredCatalog, parseCatalog, readRegisteredSkill } from "../src/catalog.mjs";

async function fixture(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "fable-local-cache-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const project = path.join(root, "project"), profile = path.join(root, "profile");
  const cache = path.join(profile, "plugins", "cache", "gigma-skills", "demo");
  await fs.mkdir(project, { recursive: true });
  await fs.mkdir(cache, { recursive: true });
  await fs.writeFile(path.join(profile, "config.toml"), '[plugins."demo@gigma-skills"]\nenabled = true\n');
  return { root, project, profile, cache };
}

async function version(cache, dir, name, manifestVersion) {
  const base = path.join(cache, dir);
  await fs.mkdir(path.join(base, ".codex-plugin"), { recursive: true });
  await fs.mkdir(path.join(base, "skills"), { recursive: true });
  const manifest = { name: "demo", skills: "./skills" };
  if (manifestVersion !== undefined) manifest.version = manifestVersion;
  await fs.writeFile(path.join(base, ".codex-plugin", "plugin.json"), JSON.stringify(manifest));
  await fs.writeFile(path.join(base, "skills", "SKILL.md"), `---\nname: ${name}\ndescription: Fixture\n---\n${name} body\n`);
}

async function catalog(f) {
  return parseCatalog(await fetchConfiguredCatalog(f.project, { profileRoot: f.profile }), f.project);
}

test("reads a local-only cache whose manifest has a semantic version", async (t) => {
  const f = await fixture(t);
  await version(f.cache, "local", "local-skill", "1.4.2");
  const result = await catalog(f);
  assert.equal(result.partial, true);
  assert.equal(result.source_warning_count, 0);
  assert.deepEqual(result.skills.map((s) => s.name), ["local-skill"]);
  assert.match((await readRegisteredSkill(result, result.skills[0].id, 0, 32000)).content, /local-skill body/);
});

test("local cache takes precedence over a semantic version", async (t) => {
  const f = await fixture(t);
  await version(f.cache, "local", "local-skill");
  await version(f.cache, "9.0.0", "old-skill", "9.0.0");
  const result = await catalog(f);
  assert.equal(result.partial, true);
  assert.equal(result.source_warning_count, 0);
  assert.deepEqual(result.skills.map((s) => s.name), ["local-skill"]);
});

test("a corrupt selected local cache reports partial without falling back", async (t) => {
  const f = await fixture(t);
  await version(f.cache, "local", "broken");
  await fs.writeFile(path.join(f.cache, "local", ".codex-plugin", "plugin.json"), "{");
  await version(f.cache, "9.0.0", "old-skill");
  const result = await catalog(f);
  assert.equal(result.partial, true);
  assert.deepEqual(result.skills, []);
});

test("semantic versions use numeric precedence", async (t) => {
  const f = await fixture(t);
  await version(f.cache, "9.0.0", "nine");
  await version(f.cache, "10.0.0", "ten");
  const result = await catalog(f);
  assert.equal(result.partial, true);
  assert.equal(result.source_warning_count, 0);
  assert.deepEqual(result.skills.map((s) => s.name), ["ten"]);
});

test("valid non-semantic versions use lexical comparison", async (t) => {
  const f = await fixture(t);
  await version(f.cache, "build-a", "older");
  await version(f.cache, "build-b", "newer");
  const result = await catalog(f);
  assert.equal(result.partial, true);
  assert.equal(result.source_warning_count, 0);
  assert.deepEqual(result.skills.map((s) => s.name), ["newer"]);
});

test("mixed semantic and non-semantic versions compare lexically", async (t) => {
  const f = await fixture(t);
  await version(f.cache, "10.0.0", "semantic");
  await version(f.cache, "build+2", "build");
  const result = await catalog(f);
  assert.equal(result.partial, true);
  assert.equal(result.source_warning_count, 0);
  assert.deepEqual(result.skills.map((s) => s.name), ["build"]);
});

test("invalid cache version names and symlinks do not become selected skills", async (t) => {
  const f = await fixture(t);
  await version(f.cache, "1.0.0", "valid");
  await version(f.cache, "z invalid", "invalid");
  const external = path.join(f.root, "external");
  await version(f.root, "external", "external");
  try {
    await fs.symlink(external, path.join(f.cache, "local"), "dir");
  } catch (error) {
    if (error.code !== "EPERM") throw error;
    t.diagnostic("Symlink creation requires Developer Mode on Windows.");
  }
  const result = await catalog(f);
  assert.equal(result.partial, true);
  assert.equal(result.source_warning_count, 0);
  assert.deepEqual(result.skills.map((s) => s.name), ["valid"]);
});

test("a local cache with invalid manifest version is partial", async (t) => {
  const f = await fixture(t);
  await version(f.cache, "local", "invalid", "not-semver");
  const result = await catalog(f);
  assert.equal(result.partial, true);
  assert.deepEqual(result.skills, []);
});

test("unrepresentable semantic version selection is partial", async (t) => {
  const f = await fixture(t);
  await version(f.cache, "18446744073709551616.0.0", "oversized");
  await version(f.cache, "9.0.0", "nine");
  const result = await catalog(f);
  assert.equal(result.partial, true);
  assert.deepEqual(result.skills, []);
});

test("ambiguous mixed version ordering is partial", async (t) => {
  const f = await fixture(t);
  await version(f.cache, "9.0.0", "nine");
  await version(f.cache, "10.0.0", "ten");
  await version(f.cache, "2build", "build");
  const result = await catalog(f);
  assert.equal(result.partial, true);
  assert.deepEqual(result.skills, []);
});
