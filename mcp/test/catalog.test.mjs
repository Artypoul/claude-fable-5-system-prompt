import assert from "node:assert/strict";
import { test } from "node:test";
import * as fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  fetchNativeCatalog,
  fetchConfiguredCatalog,
  parseCatalog,
  readRegisteredSkill,
  projectDirectory,
  sha256,
} from "../src/catalog.mjs";

test("configured catalogue reads enabled cache skills without spawning Codex", async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "fable5-configured-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const project = path.join(root, "project"),
    profile = path.join(root, "profile"),
    skill = path.join(profile, "plugins", "cache", "gigma-skills", "demo", "1.0.0", "skills", "demo", "SKILL.md");
  await fs.mkdir(path.dirname(skill), { recursive: true });
  await fs.mkdir(project, { recursive: true });
  await fs.writeFile(skill, "---\nname: demo\ndescription: Demo skill\n---\n# Demo\n");
  await fs.mkdir(path.join(profile, "plugins", "cache", "gigma-skills", "demo", "1.0.0", ".codex-plugin"), { recursive: true });
  await fs.writeFile(path.join(profile, "plugins", "cache", "gigma-skills", "demo", "1.0.0", ".codex-plugin", "plugin.json"),
    JSON.stringify({ name: "demo", skills: "./skills" }));
  await fs.writeFile(path.join(profile, "config.toml"),
    '[plugins."demo@gigma-skills"]\nenabled = true\n');
  const catalog = parseCatalog(
    await fetchConfiguredCatalog(project, { profileRoot: profile }),
    project,
  );
  assert.equal(catalog.skills.length, 1);
  assert.equal(catalog.skills[0].plugin_id, "demo@gigma-skills");
  assert.equal(catalog.skills[0].path, await fs.realpath(skill));
  assert.equal(catalog.partial, false);
});

test("configured catalogue accepts matching plugin versions with build metadata", async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "fable5-build-version-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const project = path.join(root, "project"), profile = path.join(root, "profile"),
    versionRoot = path.join(profile, "plugins", "cache", "gigma-skills", "demo", "0.1.0+codex.20261110053238");
  await fs.mkdir(project, { recursive: true });
  await fs.mkdir(path.join(versionRoot, ".codex-plugin"), { recursive: true });
  await fs.mkdir(path.join(versionRoot, "skills"), { recursive: true });
  await fs.writeFile(path.join(profile, "config.toml"), '[plugins."demo@gigma-skills"]\nenabled = true\n');
  await fs.writeFile(path.join(versionRoot, ".codex-plugin", "plugin.json"), JSON.stringify({ name: "demo", version: "0.1.0", skills: "./skills" }));
  await fs.writeFile(path.join(versionRoot, "skills", "SKILL.md"), "---\nname: demo\ndescription: Demo skill\n---\n");
  const catalog = parseCatalog(await fetchConfiguredCatalog(project, { profileRoot: profile }), project);
  assert.equal(catalog.partial, false);
  assert.equal(catalog.warning_count, 0);
  assert.equal(catalog.skills[0]?.plugin_id, "demo@gigma-skills");
});

test("configured catalogue rejects invalid, different core and different prerelease versions", async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "fable5-version-mismatch-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const project = path.join(root, "project"), profile = path.join(root, "profile");
  await fs.mkdir(project, { recursive: true });
  const cases = [["core", "1.0.0+build", "2.0.0"], ["pre", "1.0.0-rc.1+build", "1.0.0-rc.2"], ["invalid", "1.0.0+build", "01.0.0"]];
  await fs.mkdir(profile, { recursive: true });
  await fs.writeFile(path.join(profile, "config.toml"), cases.map(([name]) => `[plugins."${name}@gigma-skills"]\nenabled = true\n`).join(""));
  for (const [name, cacheVersion, manifestVersion] of cases) {
    const versionRoot = path.join(profile, "plugins", "cache", "gigma-skills", name, cacheVersion);
    await fs.mkdir(path.join(versionRoot, ".codex-plugin"), { recursive: true });
    await fs.mkdir(path.join(versionRoot, "skills"), { recursive: true });
    await fs.writeFile(path.join(versionRoot, ".codex-plugin", "plugin.json"), JSON.stringify({ name, version: manifestVersion, skills: "./skills" }));
    await fs.writeFile(path.join(versionRoot, "skills", "SKILL.md"), `---\nname: ${name}\ndescription: Demo\n---\n`);
  }
  const catalog = parseCatalog(await fetchConfiguredCatalog(project, { profileRoot: profile }), project);
  assert.equal(catalog.skills.length, 0);
  assert.equal(catalog.warning_count, 3);
});

test("configured catalogue honors a custom CODEX_HOME without appending .codex", async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "fable5-codex-home-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const project = path.join(root, "project"),
    skill = path.join(root, "plugins", "cache", "gigma-skills", "demo", "1.0.0", "skills", "demo", "SKILL.md"),
    previous = process.env.CODEX_HOME;
  await fs.mkdir(path.dirname(skill), { recursive: true });
  await fs.mkdir(project, { recursive: true });
  await fs.writeFile(skill, "---\nname: demo\ndescription: Demo skill\n---\n");
  await fs.mkdir(path.join(root, "plugins", "cache", "gigma-skills", "demo", "1.0.0", ".codex-plugin"), { recursive: true });
  await fs.writeFile(path.join(root, "plugins", "cache", "gigma-skills", "demo", "1.0.0", ".codex-plugin", "plugin.json"),
    JSON.stringify({ name: "demo", skills: "./skills" }));
  await fs.writeFile(path.join(root, "config.toml"),
    '[plugins."demo@gigma-skills"]\nenabled = true\n');
  process.env.CODEX_HOME = root;
  t.after(() => {
    if (previous === undefined) delete process.env.CODEX_HOME;
    else process.env.CODEX_HOME = previous;
  });
  const catalog = parseCatalog(await fetchConfiguredCatalog(project), project);
  assert.equal(catalog.skills.length, 1);
  assert.equal(catalog.skills[0].plugin_id, "demo@gigma-skills");
});

test("configured catalogue includes CODEX_HOME skills and reports partial metadata", async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "fable5-user-skills-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const project = path.join(root, "project"),
    profile = path.join(root, "profile"),
    valid = path.join(profile, "skills", "demo", "SKILL.md"),
    invalid = path.join(profile, "skills", "broken", "SKILL.md");
  await fs.mkdir(project, { recursive: true });
  await fs.mkdir(path.dirname(valid), { recursive: true });
  await fs.mkdir(path.dirname(invalid), { recursive: true });
  await fs.writeFile(path.join(profile, "config.toml"), "");
  await fs.writeFile(valid, "---\nname: demo\ndescription: User skill\n---\n");
  await fs.writeFile(invalid, "invalid frontmatter");
  const catalog = parseCatalog(
    await fetchConfiguredCatalog(project, { profileRoot: profile }),
    project,
  );
  assert.equal(catalog.skills.length, 1);
  assert.equal(catalog.skills[0].name, "demo");
  assert.equal(catalog.skills[0].scope, "user");
  assert.equal(catalog.skills[0].plugin_id, null);
  assert.equal(catalog.partial, true);
  assert.ok(catalog.warning_count > 0);
});

test("configured catalogue follows safe skill-directory symlinks with cycle protection", async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "fable5-directory-symlink-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const project = path.join(root, "project"),
    profile = path.join(root, "profile"),
    allowed = path.join(profile, "skills", "real"),
    inside = path.join(profile, "skills", "alias"),
    cycle = path.join(allowed, "cycle"),
    external = path.join(root, "external"),
    outside = path.join(profile, "skills", "outside");
  await fs.mkdir(project, { recursive: true });
  await fs.mkdir(allowed, { recursive: true });
  await fs.mkdir(external, { recursive: true });
  await fs.writeFile(path.join(profile, "config.toml"), "");
  await fs.writeFile(path.join(allowed, "SKILL.md"), "---\nname: real\ndescription: Real skill\n---\n");
  await fs.writeFile(path.join(external, "SKILL.md"), "---\nname: external\ndescription: External skill\n---\n");
  try {
    await fs.symlink(allowed, inside, "dir");
    await fs.symlink(path.join(profile, "skills"), cycle, "dir");
    await fs.symlink(external, outside, "dir");
  } catch (error) {
    if (error.code !== "EPERM") throw error;
    t.diagnostic("Skill-directory symlink checks require Developer Mode on Windows; Linux CI exercises this boundary.");
    return;
  }
  const catalog = await fetchConfiguredCatalog(project, { profileRoot: profile });
  assert.deepEqual(catalog.data[0].skills.map((skill) => skill.name), ["real"]);
  assert.ok(catalog.data[0].errors.some((error) => error.path === outside));
});

test("configured catalogue rejects a plugin cache root whose realpath escapes the profile", async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "fable5-plugin-cache-symlink-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const project = path.join(root, "project"),
    profile = path.join(root, "profile"),
    cacheParent = path.join(profile, "plugins", "cache", "gigma-skills"),
    cacheLink = path.join(cacheParent, "demo"),
    external = path.join(root, "external", "demo", "1.0.0");
  await fs.mkdir(project, { recursive: true });
  await fs.mkdir(profile, { recursive: true });
  await fs.mkdir(path.join(external, ".codex-plugin"), { recursive: true });
  await fs.mkdir(path.join(external, "skills"), { recursive: true });
  await fs.writeFile(path.join(profile, "config.toml"),
    '[plugins."demo@gigma-skills"]\nenabled = true\n');
  await fs.writeFile(path.join(external, ".codex-plugin", "plugin.json"),
    JSON.stringify({ name: "demo", skills: "./skills" }));
  await fs.writeFile(path.join(external, "skills", "SKILL.md"),
    "---\nname: external\ndescription: External skill\n---\n");
  try {
    await fs.mkdir(cacheParent, { recursive: true });
    await fs.symlink(path.join(root, "external", "demo"), cacheLink, "dir");
  } catch (error) {
    if (error.code !== "EPERM") throw error;
    t.diagnostic("Plugin-cache symlink checks require Developer Mode on Windows; Linux CI exercises this boundary.");
    return;
  }
  const catalog = await fetchConfiguredCatalog(project, { profileRoot: profile });
  assert.deepEqual(catalog.data[0].skills, []);
  assert.ok(catalog.data[0].errors.some((error) =>
    error.path === cacheLink && error.message === "plugin cache escapes profile"));
});

test("configured catalogue aborts during a direct walk", async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "fable5-abort-walk-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const project = path.join(root, "project"), profile = path.join(root, "profile"), skills = path.join(profile, "skills");
  await fs.mkdir(project, { recursive: true });
  await fs.mkdir(skills, { recursive: true });
  await fs.writeFile(path.join(profile, "config.toml"), "");
  for (let index = 0; index < 400; index++) {
    const filename = path.join(skills, `skill-${index}`, "SKILL.md");
    await fs.mkdir(path.dirname(filename), { recursive: true });
    await fs.writeFile(filename, `---\nname: skill-${index}\ndescription: Skill ${index}\n---\n`);
  }
  const controller = new AbortController();
  const pending = fetchConfiguredCatalog(project, { profileRoot: profile, signal: controller.signal });
  setTimeout(() => controller.abort(), 0);
  await assert.rejects(pending, { code: "CANCELLED" });
});

test("configured catalogue rejects a skill path symlink before resolving its target", async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "fable5-configured-symlink-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const project = path.join(root, "project"),
    profile = path.join(root, "profile"),
    target = path.join(root, "target", "SKILL.md"),
    link = path.join(root, "configured", "SKILL.md");
  await fs.mkdir(project, { recursive: true });
  await fs.mkdir(profile, { recursive: true });
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.mkdir(path.dirname(link), { recursive: true });
  await fs.writeFile(target, "---\nname: target\ndescription: Target skill\n---\n");
  try {
    await fs.symlink(target, link);
  } catch (error) {
    if (error.code !== "EPERM") throw error;
    t.diagnostic("Configured-skill symlink check requires Developer Mode on Windows; Linux CI exercises this boundary.");
    return;
  }
  const configuredPath = link.replaceAll("\\", "/");
  await fs.writeFile(path.join(profile, "config.toml"),
    `[[skills.config]]\nenabled = true\npath = "${configuredPath}"\n`);
  const catalog = await fetchConfiguredCatalog(project, { profileRoot: profile });
  assert.deepEqual(catalog.data[0].skills, []);
  assert.ok(catalog.data[0].errors.some((error) => error.path === link));
});

test("configured catalogue chooses highest semver and reports invalid metadata", async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "fable5-configured-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const project = path.join(root, "project"), profile = path.join(root, "profile"),
    cache = path.join(profile, "plugins", "cache", "gigma-skills", "demo");
  await fs.mkdir(project, { recursive: true });
  await fs.mkdir(profile, { recursive: true });
  await fs.writeFile(path.join(profile, "config.toml"),
    '[plugins."demo@gigma-skills"]\nenabled = true\n[plugins."broken@gigma-skills"]\nenabled = true\n');
  for (const version of ["1.9.0", "1.10.0"]) {
    const dir = path.join(cache, version, ".codex-plugin");
    await fs.mkdir(path.join(cache, version, "skills"), { recursive: true });
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, "plugin.json"), JSON.stringify({ name: "demo", skills: "./skills" }));
    await fs.writeFile(path.join(cache, version, "skills", "SKILL.md"),
      `---\nname: ${version}\ndescription: Selected\n---\n`);
  }
  const invalid = path.join(profile, "plugins", "cache", "gigma-skills", "broken", "1.0.0", ".codex-plugin");
  await fs.mkdir(invalid, { recursive: true });
  await fs.writeFile(path.join(invalid, "plugin.json"), JSON.stringify({ name: "broken", skills: "./skills" }));
  const catalog = await fetchConfiguredCatalog(project, { profileRoot: profile });
  assert.equal(catalog.data[0].skills[0].name, "1.10.0");
  assert.ok(catalog.data[0].errors.some((error) => error.path.includes("broken")));
});

test("configured catalogue applies stable and prerelease semver precedence", async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "fable5-semver-precedence-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const project = path.join(root, "project"), profile = path.join(root, "profile");
  await fs.mkdir(project, { recursive: true });
  await fs.mkdir(profile, { recursive: true });
  await fs.writeFile(path.join(profile, "config.toml"),
    '[plugins."stable@gigma-skills"]\nenabled = true\n[plugins."prerelease@gigma-skills"]\nenabled = true\n');
  const versions = [
    ["stable", ["1.0.0-rc.1", "1.0.0"]],
    ["prerelease", ["1.0.0-alpha", "1.0.0-alpha.1", "1.0.0-alpha.beta", "1.0.0-beta", "1.0.0-beta.2", "1.0.0-beta.11", "1.0.0-rc.1"]],
  ];
  for (const [plugin, pluginVersions] of versions) {
    for (const version of pluginVersions) {
      const versionRoot = path.join(profile, "plugins", "cache", "gigma-skills", plugin, version);
      await fs.mkdir(path.join(versionRoot, ".codex-plugin"), { recursive: true });
      await fs.mkdir(path.join(versionRoot, "skills"), { recursive: true });
      await fs.writeFile(path.join(versionRoot, ".codex-plugin", "plugin.json"),
        JSON.stringify({ name: plugin, skills: "./skills" }));
      await fs.writeFile(path.join(versionRoot, "skills", "SKILL.md"),
        `---\nname: ${version}\ndescription: Selected\n---\n`);
    }
  }
  const catalog = parseCatalog(await fetchConfiguredCatalog(project, { profileRoot: profile }), project);
  assert.equal(catalog.skills.find((skill) => skill.plugin_id === "stable@gigma-skills").name, "1.0.0");
  assert.equal(catalog.skills.find((skill) => skill.plugin_id === "prerelease@gigma-skills").name, "1.0.0-rc.1");
});

test("configured catalogue limits repository visibility to the project and marks bad frontmatter partial", async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "fable5-configured-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const project = path.join(root, "project"), profile = path.join(root, "profile"),
    visible = path.join(project, ".agents", "skills", "visible", "SKILL.md"),
    outside = path.join(root, "outside", ".agents", "skills", "hidden", "SKILL.md");
  await fs.mkdir(path.dirname(visible), { recursive: true });
  await fs.mkdir(path.dirname(outside), { recursive: true });
  await fs.mkdir(profile, { recursive: true });
  await fs.writeFile(path.join(profile, "config.toml"), "");
  await fs.writeFile(visible, "---\nname: visible\ndescription: Visible\n---\n");
  await fs.writeFile(outside, "---\nname: hidden\ndescription: Hidden\n---\n");
  const catalog = await fetchConfiguredCatalog(project, { profileRoot: profile });
  assert.deepEqual(catalog.data[0].skills.map((skill) => skill.name), ["visible"]);
  await fs.mkdir(path.join(project, ".agents", "skills", "bad"), { recursive: true });
  await fs.writeFile(path.join(project, ".agents", "skills", "bad", "SKILL.md"), "bad");
  const partial = await fetchConfiguredCatalog(project, { profileRoot: profile });
  assert.ok(partial.data[0].errors.length > 0);
});

test("configured catalogue skips enabled plugins without skills and accepts large bodies", async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "fable5-configured-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const project = path.join(root, "project"), profile = path.join(root, "profile"),
    pluginRoot = path.join(profile, "plugins", "cache", "gigma-skills", "tools", "1.0.0"),
    docsRoot = path.join(profile, "plugins", "cache", "gigma-skills", "docs", "1.0.0");
  await fs.mkdir(project, { recursive: true });
  await fs.mkdir(profile, { recursive: true });
  await fs.writeFile(path.join(profile, "config.toml"), '[plugins."tools@gigma-skills"]\nenabled = true\n[plugins."docs@gigma-skills"]\nenabled = true\n');
  await fs.mkdir(path.join(pluginRoot, ".codex-plugin"), { recursive: true });
  await fs.writeFile(path.join(pluginRoot, ".codex-plugin", "plugin.json"), JSON.stringify({ name: "tools" }));
  await fs.mkdir(path.join(docsRoot, ".codex-plugin"), { recursive: true });
  await fs.writeFile(path.join(docsRoot, ".codex-plugin", "plugin.json"), JSON.stringify({ name: "docs", skills: "./skills", version: "1.0.0" }));
  const skill = path.join(docsRoot, "skills", "large", "SKILL.md");
  await fs.mkdir(path.dirname(skill), { recursive: true });
  await fs.writeFile(skill, "---\nname: large\ndescription: Large body\n---\n" + "x".repeat(100 * 1024));
  const catalog = await fetchConfiguredCatalog(project, { profileRoot: profile });
  assert.equal(catalog.data[0].errors.length, 0);
  assert.equal(catalog.data[0].skills.length, 1);
});

test("configured catalogue bounds frontmatter reads at the skill size limit", async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "fable5-frontmatter-limit-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const project = path.join(root, "project"), profile = path.join(root, "profile"),
    skillRoot = path.join(profile, "skills", "oversized"), skill = path.join(skillRoot, "SKILL.md");
  await fs.mkdir(project, { recursive: true });
  await fs.mkdir(skillRoot, { recursive: true });
  await fs.writeFile(path.join(profile, "config.toml"), "");
  await fs.writeFile(skill, "---\nname: oversized\ndescription: Too large\n---\n" + "x".repeat(1024 * 1024));
  const catalog = await fetchConfiguredCatalog(project, { profileRoot: profile });
  assert.deepEqual(catalog.data[0].skills, []);
  assert.ok(catalog.data[0].errors.some((error) => error.path === skill));
});

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
