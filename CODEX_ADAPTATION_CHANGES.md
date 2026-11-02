# Codex adaptation change list

This file records the deliberate changes in the Codex adaptation pull request.

## Goal

Make the useful workflow guidance from the Fable 5 archive usable by Codex without pretending that Claude's runtime, tools, filesystem, provider APIs, or citation protocol exist in Codex.

## Files added

### .agents/skills/fable5-codex/SKILL.md

Adds the discoverable Codex skill. It preserves the archive's broad numbered scaffold while translating each section into current Codex concepts:

1. behavior and identity;
2. task framing and context;
3. repository discovery;
4. skills and progressive disclosure;
5. coding workflow;
6. search and current information;
7. visual work;
8. tool families;
9. product logic;
10. documentation and marketing;
11. external APIs and connectors;
12. citations;
13. files and persistence;
14. safety and refusal handling;
15. verification;
16. GitHub handoff.

The skill explicitly says that the archived prompt is reference material and that live system, developer, user, repository, skill, and tool instructions remain authoritative.

### .agents/skills/fable5-codex/references/codex-tool-matrix.md

Adds a compact mapping from workflow needs to the current Codex tool families. It avoids embedding volatile JSON schemas or pretending that a fixed tool registry is permanent.

### scripts/verify_codex_skill.py

Adds a standard-library validator for the new skill. It checks the front matter, required sections, reference link, and absence of Claude-specific runtime artifacts such as fixed Claude paths, Anthropic API endpoints, legacy invoke blocks, and legacy cite tags.

## Files updated

### README.md

Adds a short Codex adaptation section and points readers to the canonical skill, tool matrix, and change list.

## Intentional non-changes

- system-prompt/full-system-prompt.md remains the attributed Fable 5 archive.
- system-prompt/tool-definitions.md remains the historical Anthropic tool-schema archive.
- system-prompt/analysis/* and highlights/* remain source analysis of the archive.
- scripts/verify_signatures.py remains an integrity check for the original curated files.
- CONTRIBUTING.md and LICENSE are unchanged.

A global search-and-replace was deliberately avoided. It would leave contradictory headings, schemas, paths, dates, provider API examples, and citations, while damaging the source archive and its attribution.

## Validation plan

Run:

~~~bash
python scripts/verify_codex_skill.py
python scripts/verify_signatures.py
git diff --check
~~~

The first command validates the Codex layer. The second confirms that original archive files were not altered. The third catches whitespace errors.
