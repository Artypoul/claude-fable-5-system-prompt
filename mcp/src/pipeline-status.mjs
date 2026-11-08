import { CatalogError, readRegisteredSkill, sha256 } from "./catalog.mjs";

const expectedSkills = [
  {
    key: "fable",
    names: ["fable5-codex:fable5-codex", "fable5-codex"],
    plugin_id: "fable5-codex@gigma-skills",
  },
  {
    key: "using_superpowers",
    names: ["superpowers:using-superpowers", "using-superpowers"],
    plugin_id: "superpowers@gigma-skills",
  },
  {
    key: "writing_plans",
    names: ["superpowers:writing-plans", "writing-plans"],
    plugin_id: "superpowers@gigma-skills",
  },
];

const fail = (code, message) => {
  throw new CatalogError(code, message);
};

const catalogSha256 = (catalog) =>
  sha256(JSON.stringify([...catalog.skills].sort((a, b) => a.id.localeCompare(b.id))));

function selectSkill(catalog, expected) {
  const matches = catalog.skills.filter(
    (skill) => expected.names.includes(skill.name) && skill.plugin_id === expected.plugin_id,
  );
  if (matches.length !== 1)
    fail(
      "PIPELINE_NOT_READY",
      `Expected exactly one ${expected.names.join(" or ")} skill from ${expected.plugin_id}.`,
    );
  return matches[0];
}

async function readCompleteSkill(catalog, skill, readSkill) {
  let offset = 0;
  let digest;
  for (;;) {
    const page = await readSkill(catalog, skill.id, offset, 32000);
    if (
      !page ||
      page.partial !== false ||
      page.warning_count !== 0 ||
      page.skill?.id !== skill.id ||
      page.skill?.name !== skill.name ||
      page.skill?.plugin_id !== skill.plugin_id ||
      page.skill?.path !== skill.path
    )
      fail("PIPELINE_NOT_READY", `Registered metadata changed while reading ${skill.name}.`);
    digest ??= page.sha256;
    if (!/^[a-f0-9]{64}$/.test(page.sha256) || page.sha256 !== digest)
      fail("PIPELINE_NOT_READY", `Content digest changed while reading ${skill.name}.`);
    if (page.next_offset == null) break;
    if (!Number.isInteger(page.next_offset) || page.next_offset <= offset)
      fail("PIPELINE_NOT_READY", `Invalid pagination for ${skill.name}.`);
    offset = page.next_offset;
  }
  return {
    id: skill.id,
    name: skill.name,
    plugin_id: skill.plugin_id,
    path: skill.path,
    sha256: digest,
  };
}

export async function diagnosePipeline(catalog, cwd, { readSkill = readRegisteredSkill } = {}) {
  if (!catalog || !Array.isArray(catalog.skills))
    fail("PIPELINE_NOT_READY", "Skill catalogue is unavailable.");
  if (catalog.partial !== false || catalog.warning_count !== 0)
    fail("PIPELINE_INCOMPLETE", "Skill catalogue is partial or contains warnings.");

  const skills = {};
  for (const expected of expectedSkills) {
    const skill = selectSkill(catalog, expected);
    skills[expected.key] = await readCompleteSkill(catalog, skill, readSkill);
  }
  return {
    status: "ready",
    cwd,
    catalog_sha256: catalogSha256(catalog),
    partial: false,
    warning_count: 0,
    skills,
  };
}

export { expectedSkills };
