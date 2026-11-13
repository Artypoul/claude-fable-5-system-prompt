import assert from "node:assert/strict";
import { test } from "node:test";
import { CatalogError, sha256 } from "../src/catalog.mjs";
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
  return { skills, partial: false, warning_count: 0, ...overrides };
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
    partial: catalog.partial,
    warning_count: catalog.warning_count,
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
