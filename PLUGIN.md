# Fable 5 Codex plugin

Version 1.0.1 packages the existing skill without rewriting, shortening or moving
any of its 18 runtime files. The supported Codex compatibility manifest at
`.codex-plugin/plugin.json` points directly to `./.agents/skills/`.
The complete archive, source mappings, license, assets, validators and tests are
included for inspection. No new MCP backend or executable search service is
introduced by packaging; tool discovery and search routing remain exactly as
defined by the existing skill.

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
codex plugin marketplace upgrade fable5 --json
codex plugin add fable5-codex@fable5 --json
codex plugin list --marketplace fable5 --json
```

The first command refreshes the tracked `main` snapshot; the second refreshes
the plugin's installed cache. When publishing a new plugin release, increment
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

The unchanged skill and source archive are based on repository commit
`308792abaa755ac34afcc5f9fd1b9d26718ab54b`. Packaging adds install/update metadata,
build checks and documentation without changing the skill's runtime content.
