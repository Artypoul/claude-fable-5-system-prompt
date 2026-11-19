import assert from "node:assert/strict";
import { test } from "node:test";
import * as fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fetchConfiguredCatalog, parseCatalog, readRegisteredSkill, CatalogError, sha256 } from "../src/catalog.mjs";
import { diagnosePipeline } from "../src/pipeline-status.mjs";

const makeCatalog = (overrides = {}) => {
  const skills = [
    ["fable", "fable5-codex:fable5-codex", "fable5-codex@gigma-skills"],
    ["using_superpowers", "superpowers:using-superpowers", "superpowers@gigma-skills"],
    ["writing_plans", "superpowers:writing-plans", "superpowers@gigma-skills"],
  ].map(([id, name, plugin_id]) => ({
    id,
    name,
    description: name,
    path: `C:/skills/${name}/SKILL.md`,
    scope: "user",
    plugin_id,
  }));
  return { skills, catalog_source: "native_host", native_context_verified: true, partial: false, warning_count: 0, source_warning_count: 0, warnings: [], ...overrides };
};

const readSkill = async (catalog, id, offset) => {
  const skill = catalog.skills.find((item) => item.id === id);
  const content = `# ${skill.name}\n`;
  return {
    skill,
    content: offset === 0 ? content : "",
    offset,
    total_chars: content.length,
    next_offset: null,
    sha256: sha256(content),
    catalog_source: catalog.catalog_source,
    native_context_verified: catalog.native_context_verified,
    partial: catalog.partial,
    warning_count: catalog.warning_count,
    source_warning_count: catalog.source_warning_count,
    warnings: catalog.warnings,
  };
};

test("reports the exact Fable and Superpowers gateway", async () => {
  const result = await diagnosePipeline(makeCatalog(), "C:/project", { readSkill });
  assert.equal(result.status, "ready");
  assert.equal(result.cwd, "C:/project");
  assert.equal(result.skills.fable.plugin_id, "fable5-codex@gigma-skills");
  assert.equal(result.skills.using_superpowers.plugin_id, "superpowers@gigma-skills");
  assert.equal(result.skills.writing_plans.plugin_id, "superpowers@gigma-skills");
  assert.match(result.catalog_sha256, /^[a-f0-9]{64}$/);
});

test("accepts exactly one supported Fable identity and preserves its evidence", async () => {
  for (const pluginId of ["fable5-codex@fable5", "fable5-codex@gigma-skills"]) {
    const catalog = makeCatalog();
    catalog.skills[0].plugin_id = pluginId;
    const result = await diagnosePipeline(catalog, "C:/project", { readSkill });
    assert.equal(result.status, "ready");
    assert.deepEqual(result.skills.fable, {
      id: catalog.skills[0].id, name: catalog.skills[0].name, plugin_id: pluginId,
      path: catalog.skills[0].path, sha256: sha256(`# ${catalog.skills[0].name}\n`),
    });
  }
});

test("rejects duplicate or unknown Fable identities and mismatched read evidence", async () => {
  const cases = [
    (catalog) => catalog.skills.push({ ...catalog.skills[0], id: "second-fable", plugin_id: "fable5-codex@fable5" }),
    (catalog) => { catalog.skills[0].plugin_id = "fable5-codex@other"; },
    (catalog) => catalog.skills.push({ ...catalog.skills[0], id: "unknown-fable", plugin_id: "fable5-codex@other" }),
  ];
  for (const change of cases) {
    const catalog = makeCatalog();
    change(catalog);
    await assert.rejects(diagnosePipeline(catalog, "C:/project", { readSkill }), { code: "PIPELINE_NOT_READY" });
  }
  for (const mismatch of ["path", "sha256"]) {
    const badRead = async (catalog, id, offset) => {
      const page = await readSkill(catalog, id, offset);
      if (id === "fable" && mismatch === "path") page.skill = { ...page.skill, path: "C:/other/SKILL.md" };
      if (id === "fable" && mismatch === "sha256") {
        page.next_offset = offset === 0 ? 1 : null;
        page.sha256 = offset === 0 ? "a".repeat(64) : "b".repeat(64);
      }
      return page;
    };
    await assert.rejects(diagnosePipeline(makeCatalog(), "C:/project", { readSkill: badRead }), { code: "PIPELINE_NOT_READY" });
  }
});

test("accepts configured short names only with the exact plugin IDs", async () => {
  const catalog = makeCatalog({
    skills: makeCatalog().skills.map((skill) => ({
      ...skill,
      name: skill.name.replace("fable5-codex:fable5-codex", "fable5-codex")
        .replace("superpowers:using-superpowers", "using-superpowers")
        .replace("superpowers:writing-plans", "writing-plans"),
    })),
  });
  const result = await diagnosePipeline(catalog, "C:/project", { readSkill });
  assert.equal(result.status, "ready");
  assert.equal(result.skills.fable.plugin_id, "fable5-codex@gigma-skills");
});

test("fails closed for partial or warning-bearing catalogues", async () => {
  await assert.rejects(
    diagnosePipeline(makeCatalog({ partial: true }), "C:/project", { readSkill }),
    (error) => error instanceof CatalogError && error.code === "PIPELINE_INCOMPLETE",
  );
  await assert.rejects(
    diagnosePipeline(makeCatalog({ warning_count: 1 }), "C:/project", { readSkill }),
    (error) => error instanceof CatalogError && error.code === "PIPELINE_INCOMPLETE",
  );
});

test("propagates an error reading writing-plans", async () => {
  const readError = new CatalogError("SKILL_UNREADABLE", "read failed");
  const failingReadSkill = async (catalog, id, offset) => {
    if (id === "writing_plans") throw readError;
    return readSkill(catalog, id, offset);
  };
  await assert.rejects(
    diagnosePipeline(makeCatalog(), "C:/project", { readSkill: failingReadSkill }),
    (error) => error === readError,
  );
});

test("fails closed when an exact plugin entry is missing or duplicated", async () => {
  const missing = makeCatalog({
    skills: makeCatalog().skills.filter((skill) => skill.name !== "superpowers:writing-plans"),
  });
  await assert.rejects(
    diagnosePipeline(missing, "C:/project", { readSkill }),
    (error) => error instanceof CatalogError && error.code === "PIPELINE_NOT_READY",
  );
  const duplicated = makeCatalog({
    skills: [...makeCatalog().skills, makeCatalog().skills[2]],
  });
  await assert.rejects(
    diagnosePipeline(duplicated, "C:/project", { readSkill }),
    (error) => error instanceof CatalogError && error.code === "PIPELINE_NOT_READY",
  );
});

test("fails closed when a registered skill changes while being read", async () => {
  const unstable = async (catalog, id, offset) => {
    const page = await readSkill(catalog, id, offset);
    if (id === "fable") page.skill = { ...page.skill, plugin_id: "wrong@plugin" };
    return page;
  };
  await assert.rejects(
    diagnosePipeline(makeCatalog(), "C:/project", { readSkill: unstable }),
    (error) => error instanceof CatalogError && error.code === "PIPELINE_NOT_READY",
  );
});

test("individually disabled required skill prevents pipeline readiness", async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "fable-pipeline-rules-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const project = path.join(root, "project"), profile = path.join(root, "profile");
  await fs.mkdir(project, { recursive: true });
  for (const [plugin, names] of [["fable5-codex", ["fable5-codex"]], ["superpowers", ["using-superpowers", "writing-plans"]]]) {
    const version = path.join(profile, "plugins", "cache", "gigma-skills", plugin, "1.0.0");
    await fs.mkdir(path.join(version, ".codex-plugin"), { recursive: true });
    await fs.writeFile(path.join(version, ".codex-plugin", "plugin.json"), JSON.stringify({ name: plugin, skills: "./skills" }));
    for (const name of names) {
      const skill = path.join(version, "skills", name, "SKILL.md");
      await fs.mkdir(path.dirname(skill), { recursive: true });
      await fs.writeFile(skill, `---\nname: ${name}\ndescription: ${name}\n---\n# ${name}\n`);
    }
  }
  const standalone = path.join(profile, "plugins", "cache", "fable5", "fable5-codex", "1.0.0");
  await fs.mkdir(path.join(standalone, ".codex-plugin"), { recursive: true });
  await fs.writeFile(path.join(standalone, ".codex-plugin", "plugin.json"), JSON.stringify({ name: "fable5-codex", skills: "./skills" }));
  const standaloneSkill = path.join(standalone, "skills", "fable5-codex", "SKILL.md");
  await fs.mkdir(path.dirname(standaloneSkill), { recursive: true });
  await fs.writeFile(standaloneSkill, "---\nname: fable5-codex\ndescription: fable\n---\n# fable\n");
  await fs.writeFile(path.join(profile, "config.toml"), '[plugins."fable5-codex@gigma-skills"]\nenabled = true\n[plugins."superpowers@gigma-skills"]\nenabled = true\n[[skills.config]]\nname = "using-superpowers"\nenabled = false\n');
  const catalog = parseCatalog(await fetchConfiguredCatalog(project, { profileRoot: profile }), project);
  await assert.rejects(diagnosePipeline(catalog, project, { readSkill: readRegisteredSkill }), { code: "PIPELINE_INCOMPLETE" });
  for (const config of [
    '[plugins."fable5-codex@fable5"]\nenabled = false\n[plugins."superpowers@gigma-skills"]\nenabled = true\n',
    '[plugins."fable5-codex@fable5"]\nenabled = true\n[plugins."superpowers@gigma-skills"]\nenabled = false\n',
    '[plugins."fable5-codex@fable5"]\nenabled = true\n',
  ]) {
    await fs.writeFile(path.join(profile, "config.toml"), config);
    const current = parseCatalog(await fetchConfiguredCatalog(project, { profileRoot: profile }), project);
    await assert.rejects(diagnosePipeline(current, project, { readSkill: readRegisteredSkill }), { code: "PIPELINE_INCOMPLETE" });
  }
  await fs.writeFile(path.join(profile, "config.toml"), '[plugins."fable5-codex@fable5"]\nenabled = false\n[plugins."fable5-codex@gigma-skills"]\nenabled = true\n[plugins."superpowers@gigma-skills"]\nenabled = true\n');
  const current = parseCatalog(await fetchConfiguredCatalog(project, { profileRoot: profile }), project);
  assert.equal(current.skills.find(s => s.name === "fable5-codex").plugin_id, "fable5-codex@gigma-skills");
  await assert.rejects(diagnosePipeline(current, project), { code: "PIPELINE_INCOMPLETE" });
});


test("rejects hidden source warnings or malformed warning metadata on a complete catalogue", async () => {
  for (const override of [
    { source_warning_count: 1 },
    { warnings: ["CATALOG_SOURCE_ERROR"] },
    { source_warning_count: undefined },
    { warnings: undefined },
    { warnings: "" },
  ]) {
    await assert.rejects(diagnosePipeline(makeCatalog(override), "C:/project", { readSkill }), { code: "PIPELINE_INCOMPLETE" });
  }
});

test("rejects unverified provenance or hidden warnings on every read page", async () => {
  for (const override of [
    { catalog_source: "configured_cache", native_context_verified: false },
    { catalog_source: "unknown" },
    { catalog_source: undefined },
    { native_context_verified: undefined },
    { native_context_verified: false },
    { source_warning_count: 1 },
    { source_warning_count: undefined },
    { warnings: ["CATALOG_SOURCE_ERROR"] },
    { warnings: undefined },
    { warnings: "" },
  ]) {
    const badRead = async (catalog, id, offset) => {
      const page = await readSkill(catalog, id, offset);
      if (id === "fable") {
        if (offset === 0) page.next_offset = 1;
        else Object.assign(page, override);
      }
      return page;
    };
    await assert.rejects(diagnosePipeline(makeCatalog(), "C:/project", { readSkill: badRead }), { code: "PIPELINE_NOT_READY" });
  }
});
