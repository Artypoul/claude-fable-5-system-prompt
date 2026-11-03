# Fable 5 Codex plugin

Version 1.3.2 adds safe updates with verified backups and rollback.
The plugin includes local read-only MCP tools `search_skills` and `read_skill`.
They use the enabled Codex catalogue for an explicitly supplied project.
Node.js 20+ and compatible Codex CLI must be on PATH; the SDK is bundled.
See [MCP setup, contracts and verification](MCP.md).

The skill retains the baseline, skill-first, sports and elicitation
restorations, and requires browser continuation after connector misses and
item-by-item image placement where the host supports it. The
unchanged upstream archive remains available for comparison. The supported Codex compatibility manifest at
`.codex-plugin/plugin.json` points directly to `./.agents/skills/`.
The complete archive, source mappings, license, assets, validators and tests are
included for inspection. The bundled MCP server supplies installed-skill search
and registered SKILL.md reading. Other archived tool families still require
their own implementations. See the [capability gaps](.agents/skills/fable5-codex/references/capability-gaps.md)
for explicit dependencies and verification requirements. This is a workflow port,
not a claim of complete runtime equivalence with the source provider.

## Behavioral checks

```sh
python -m unittest discover -s tests -v
python scripts/evaluate_behavior.py --run-model --output /absolute/path/behavior-results.json
```

The first command runs deterministic integrity, packaging and scenario-checker
tests in CI. The second uses the authenticated Codex CLI to generate action
plans for 21 independent scenarios, using this checkout's instructions. It can
consume model quota; it never executes proposed actions or calls live sports,
storage or model backends. Expected traces are not included in the model input.
Without a CLI or authentication it fails explicitly, rather than reporting a pass.
Use `--baseline-ref 73636bd` to evaluate 1.1.0 against the same scenarios.
A second, separate model call judges the meaning of answers in the four
capability-gap scenarios. Eight controls include false persistence, model API,
browser and statistics claims, plus truthful qualified answers. Expected control
verdicts are hidden from the judge, just as expected action traces are hidden
from the plan generator. A failed control or missing answer review prevents
acceptance; correct gap markers cannot excuse a contradictory answer.
Model output and instruction fingerprints are written to the selected output
path; keep both `.plan.events.jsonl` and `.judge.events.jsonl` logs outside the
repository. These evaluations do
not prove reliability on every task or provide missing backend implementations.

After a successful model run, copy its JSON observation (not its raw event log)
to `tests/behavior/observed-results.json`. CI rechecks the observed plans against
the scenarios, answer reviews and controls. It verifies fingerprints of the
instructions, full skill package, scenario definitions, controls and evaluator,
plus hashes binding the actual submitted prompts and generated response.
All inputs are frozen before calling the model. Changes during either model
call abort the run instead of receiving new fingerprints. Changed inputs
invalidate the observation and require a new model run. This is replay of recorded evidence,
not a fresh model call on each CI run. The answer judge is also a model and can
make mistakes; inspect its reasons and the proposed answers before accepting
a new observation. Passing these fixtures is not proof of complete equivalence.

## Install from GitHub

```sh
codex plugin marketplace add Artypoul/claude-fable-5-system-prompt --ref main
codex plugin add fable5-codex@fable5 --json
codex plugin list --marketplace fable5 --json
```

Verify that the result says `installed: true` and `enabled: true` and the
marketplace source is the GitHub repository. The stable marketplace name is
`fable5`; the plugin ID is `fable5-codex@fable5`.

The marketplace is configured at user level and is available across projects.
Codex loads an installed cache copy, not the source folder. Restart/reload Codex
or start a new chat if the running client's skill catalogue has not refreshed.
The plugin skill's qualified name is `$fable5-codex:fable5-codex`.

## Update from GitHub

```sh
node /absolute/path/to/installed/plugin/mcp/dist/update.mjs update --project /absolute/path/to/project
```

Используйте [safe updater](SAFE_UPDATE.md): он сохраняет настройки и пакет,
проверяет установленную версию реальными MCP-вызовами и откатывает обычные
ошибки. Версия закрепляется на проверенном Git SHA; следующий безопасный
update снова проверяет `main`. Прямые `marketplace upgrade` / `plugin add`
обходят эти проверки и не создают наш бэкап.

When publishing a new plugin release, increment
`version` in `.codex-plugin/plugin.json`, run the package checks, and push the
changes. Keep the plugin and marketplace names stable across releases.

## Migrate from the earlier local installation

Install and verify `fable5-codex@fable5` first using the commands above. If the
old `fable5-codex@fable5-local` plugin is installed, retire only that duplicate:

```sh
codex plugin remove fable5-codex@fable5-local
codex plugin marketplace remove fable5-local
```

This does not remove an independently installed standalone skill. Preserve a
backup before retiring that copy if it has local customizations.

## Build a ZIP

The repository's `.gitattributes` keeps source files at LF even on Windows.
This matters because the integrity validator pins exact Git blob bytes.

```sh
python scripts/verify_codex_skill.py
python -m unittest discover -s tests -v
python scripts/package_plugin.py --output /absolute/path/fable5-codex-plugin.zip
```

The ZIP contains a single `fable5-codex/` directory. Extract that directory to a
durable location and install through the native CLI:

```sh
codex plugin marketplace add /absolute/path/fable5-codex
codex plugin add fable5-codex@fable5 --json
codex plugin list --marketplace fable5 --json
```

Use this local ZIP alternative only when you do not want to track the GitHub
marketplace. To update a ZIP-based install, replace the source with a newly
validated extraction and rerun `codex plugin add fable5-codex@fable5`. Never edit
the plugin cache as the source of truth.

The initial plugin packaging was based on repository commit
`308792abaa755ac34afcc5f9fd1b9d26718ab54b`. Subsequent skill changes are recorded
in `CODEX_ADAPTATION_CHANGES.md`; the upstream archive remains unchanged.
