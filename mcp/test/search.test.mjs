import assert from "node:assert/strict";
import { test } from "node:test";
import { searchSkills } from "../src/search.mjs";

const skills = [
  {
    id: "a",
    name: "pdf",
    description: "Read and create PDF documents",
    path: "/skills/pdf/SKILL.md",
    scope: "user",
    plugin_id: null,
  },
  {
    id: "b",
    name: "review",
    description: "Review code and PDF output",
    path: "/skills/review/SKILL.md",
    scope: "repo",
    plugin_id: null,
  },
  {
    id: "c",
    name: "проверка",
    description: "Проверка документов",
    path: "/skills/check/SKILL.md",
    scope: "user",
    plugin_id: null,
  },
];

test("exact name outranks description; nonmatches are excluded", () => {
  const result = searchSkills(skills, "PDF", 10, 0);
  assert.deepEqual(
    result.skills.map((s) => s.id),
    ["a", "b"],
  );
  assert.equal(result.total, 2);
  assert.equal(result.next_offset, null);
});

test("empty query browses a stable paginated catalogue", () => {
  const all = searchSkills(skills, "", 50, 0);
  const first = searchSkills(skills, "", 1, 0);
  const rest = searchSkills(skills, "", 50, first.next_offset);
  assert.deepEqual([...first.skills, ...rest.skills], all.skills);
  assert.deepEqual(searchSkills(skills, "", 10, 100).skills, []);
});

test("Unicode normalization and punctuation-only searches", () => {
  assert.equal(searchSkills(skills, "ПРОВЕРКА", 10, 0).skills[0].id, "c");
  assert.equal(searchSkills(skills, "ＰＤＦ", 10, 0).skills[0].id, "a");
  assert.equal(searchSkills(skills, "!!!", 10, 0).total, 0);
});
