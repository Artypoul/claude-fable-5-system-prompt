<div align="center">

# Fable 5 Codex Plugin

### Плагин для OpenAI Codex с полным source-based skill Fable 5

![Fable 5 Codex Skill](assets/fable5-hero.png)

[![Codex Skill](https://img.shields.io/badge/Codex-skill-412991)](.agents/skills/fable5-codex/SKILL.md)
[![Python 3.10+](https://img.shields.io/badge/Python-3.10%2B-3776AB)](https://www.python.org/)
[![Validation](https://github.com/Artypoul/claude-fable-5-system-prompt/actions/workflows/codex-skill-validation.yml/badge.svg)](https://github.com/Artypoul/claude-fable-5-system-prompt/actions/workflows/codex-skill-validation.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

*Community-maintained adaptation of the Fable 5 workflow for Codex. The historical source archive is retained for provenance and comparison.*

</div>

---

## What this repository is

This repository packages a **Codex plugin with the complete source-based Fable 5 skill**. It adapts the original sixteen-section structure into a reusable workflow for:

- coding and implementation;
- code review, debugging and testing;
- research and evidence-based answers;
- product decisions and business rules;
- files, artifacts and delivery;
- GitHub and repository handoff.

The active entry point is [.agents/skills/fable5-codex/SKILL.md](.agents/skills/fable5-codex/SKILL.md). The skill is backed by a canonical source-faithful port, engineering supplements, a traceability record, a deterministic validator and regression tests.

This is **workflow guidance for Codex**, not a system prompt, model identity, hidden API, credential, permission grant or replacement for the active system and developer instructions. The skill cannot give Codex tools or access that the host has not provided.

## Install and use

Install the complete plugin globally from this repository:

~~~sh
codex plugin marketplace add Artypoul/claude-fable-5-system-prompt --ref main
codex plugin add fable5-codex@fable5
~~~

Update the repository snapshot and refresh the installed plugin:

~~~sh
codex plugin marketplace upgrade fable5
codex plugin add fable5-codex@fable5
~~~

The plugin loads the same complete skill directory through its manifest.
See [Plugin packaging and installation](PLUGIN.md) for verification, ZIP builds
and migration from the earlier local installation. Standalone skill installation
below is still supported.

Version 1.1.0 restores the source's baseline for simple tasks, unconditional
skill-first checks and mandatory sports retrieval. See [capability gaps](.agents/skills/fable5-codex/references/capability-gaps.md)
for services the host must supply and [behavioral checks](PLUGIN.md#behavioral-checks)
for deterministic tests and separate model-based action-plan evaluation.

Copy the complete [.agents/skills/fable5-codex](.agents/skills/fable5-codex) directory into a supported Codex skill location. If the Codex client supports explicit skill mentions, invoke it as `$fable5-codex`.

Before using the skill in a project:

1. read the repository's applicable `AGENTS.md` and local instructions;
2. inspect the current branch, working tree and affected paths;
3. load only the source-based sections and engineering references relevant to the task;
4. preserve unrelated work and verify the actual result.

The skill follows the host's current permissions, tool schemas, safety rules, network policy and filesystem boundaries.

## What is adapted

The Codex port preserves the source archive's sixteen-section order while replacing provider-specific assumptions with Codex-compatible guidance:

- [Skill entry point](.agents/skills/fable5-codex/SKILL.md) — routing, boundaries and the sixteen sections.
- [Source-faithful port](.agents/skills/fable5-codex/references/source-faithful-port.md) — adapted rules, examples, conditions and source mappings.
- [Engineering workflow](.agents/skills/fable5-codex/references/engineering-workflow.md) — implementation, review, testing and delivery practices.
- [Changes and traceability](CODEX_ADAPTATION_CHANGES.md) — provenance, substitutions and source-block fingerprints.
- [Codex tool matrix](.agents/skills/fable5-codex/references/codex-tool-matrix.md) — supplementary capability mapping; it is not a live tool registry.

The source archive remains useful for comparison, but the adapted skill is the primary deliverable in this repository.

## Repository structure

~~~text
claude-fable-5-system-prompt/
├── .agents/skills/fable5-codex/
│   ├── SKILL.md
│   └── references/                  ← source port and engineering supplements
├── CODEX_ADAPTATION_CHANGES.md      ← provenance and traceability
├── system-prompt/                   ← historical source archive and analysis
├── highlights/                      ← historical archive highlights
├── scripts/
│   ├── verify_codex_skill.py        ← structural and traceability validator
│   └── verify_signatures.py         ← source archive integrity check
├── tests/
│   └── test_codex_port.py           ← regression tests for the Codex port
└── .github/workflows/
    └── codex-skill-validation.yml   ← CI validation
~~~

## Validate the port

Run from the repository root with Python 3.10 or newer:

~~~bash
python3 -m py_compile scripts/verify_codex_skill.py
python3 scripts/verify_codex_skill.py
python3 -m unittest discover -s tests -v
python3 scripts/verify_signatures.py
git diff --check
~~~

The validator checks source-file pins, front matter, section order, local links, source-to-target mappings and body fingerprints. The regression tests include negative mutations for structural and traceability failures. These checks do not prove semantic equivalence, model behaviour or that a particular Codex client will discover a skill; validate discovery in the target client.

The [GitHub Actions workflow](.github/workflows/codex-skill-validation.yml) runs the same repository checks on changes to the port.

## Historical source archive

The repository retains the source material that the adaptation is based on:

- [Full source archive](system-prompt/full-system-prompt.md)
- [Archived tool definitions](system-prompt/tool-definitions.md)
- [Source analysis](system-prompt/analysis/)
- [Archive highlights](highlights/surprising-revelations.md)

These files are reference and provenance material. They are not additional runtime instructions for Codex. The preserved source archive was originally curated and extracted by [Sayan Chowdhury](https://github.com/saynchowdhury); its attribution and licensing context remains in the preserved files and [LICENSE](LICENSE).

## Contributing

Changes to the active skill should include an update to the relevant traceability records and regression coverage when behaviour or structure changes. Keep the source archive separate from the Codex adaptation.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the contribution workflow.

## Disclaimer

This is a community adaptation for educational, research and engineering use. It does not claim to reproduce a provider's private runtime configuration, guarantee a model's behaviour or grant access to undocumented capabilities. Follow the active Codex, repository and project instructions for every task.

## License

MIT. See [LICENSE](LICENSE).
