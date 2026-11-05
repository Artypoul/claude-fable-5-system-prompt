# Fable 5 scope guard 1.3.3 release plan

> **For agentic workers:** Use superpowers:executing-plans for this release. Reuse the approved scope-guard design and completed reviews.

**Goal:** Publish the reviewed scope and pattern gates as plugin 1.3.3 and verify a real safe update from the installed 1.3.2 package.

**Approach:** Transfer the four approved instruction files and their genuine model observation unchanged. Increment the plugin release version, preserve stable marketplace identity and strict package checks, validate the source and publish through a checked pull request and tagged release. A reproduced native bookkeeping incompatibility is corrected in the existing updater.

**Tech stack:** Markdown instructions, Python package checks, Node.js bundled MCP/updater, GitHub Actions, native Codex plugin installation.

**Spec:** The approved scope guard in `.agents/skills/fable5-codex/SKILL.md` and `references/coding-workflow.md`: file/section/behavior/database-field scope; immediate warning and contained selective recovery; patterns require both necessity evidence and explicit permission.

## Global constraints

- Plugin version `1.3.3`; plugin name `fable5-codex`; marketplace `fable5`.
- Preserve the approved instruction bytes and bound observation; no extra skill redesign.
- Preserve the original archive, source traceability, internal MCP version, MCP server behavior and user configuration. Limit runtime changes to the reproduced Git-marketplace bookkeeping issue and its rebuilt updater bundle.
- Reuse a clean existing checkout and a task branch. Preserve unrelated branches and files.
- The user authorized publication and updating the current installation. Preserve local customizations before restoring only the five known modified package paths for updater preflight.
- No new architectural patterns, database operations or changes to other plugins.

## Review focus

- A file-level allowlist must not replace section, behavior or database-field scope.
- Warning and recovery evidence must precede waits and potentially destructive restoration; concurrent edits must be preserved.
- Repository conventions and existing patterns must not replace explicit permission or necessity evidence.
- Release metadata must retain native catalogue and updater compatibility; unchanged MCP bundles must remain reproducible.
- The real installed package must pass exact-byte integrity and native MCP/catalogue health checks after updating.
- Native marketplace metadata may be excluded only after validation and proof that it is not tracked package content; cache, candidates, backups and all other extra files remain strict.

## Task 1: Prepare and validate the release source

Files: the four instruction files; `tests/behavior/observed-results.json`; `.codex-plugin/plugin.json`; `PLUGIN.md`; `CODEX_ADAPTATION_CHANGES.md`; `SAFE_UPDATE.md`; this plan; `mcp/src/update-native.mjs`; `mcp/test/update-native.test.mjs`; `mcp/dist/update.mjs`; `mcp/dist/build-info.json`.

- [ ] Transfer the five reviewed files and verify their hashes/observation against the approved revision.
- [ ] Set `.codex-plugin/plugin.json` to `1.3.3`; document the scope gate and selective recovery in release prose.
- [ ] Reproduce clean Git-marketplace rejection caused by native bookkeeping, add bounded validation/exclusion and negative tests, and rebuild the updater. Keep global inventory behavior unchanged.
- [ ] Run syntax/package/archive checks, all 54 Python regressions, `npm ci --ignore-scripts`, `npm run build`, `npm test`, and verify no MCP bundle drift.
- [ ] Build the distributable ZIP outside the source checkout and verify its version and instruction contents.
- [ ] Commit only the fourteen listed source/release paths.

## Task 2: Review and publish

- [ ] Obtain an actual fresh read-only review of the release diff; preserve its scope, revision and verdict.
- [ ] Push the task branch, create a pull request, and require successful Actions for its exact head.
- [ ] Merge the checked pull request, verify `main` and its Actions, and create release tag `v1.3.3` on the verified merge commit with the validated plugin ZIP.

## Task 3: Verify safe installation

- [ ] Preserve the locally modified installed package and its five-file patch outside the native cache/marketplace.
- [ ] Revalidate old HEAD and customizations, restore only those five known paths to their original 1.3.2 commit, and verify complete cache/marketplace inventories.
- [ ] Invoke the trusted rebuilt 1.3.3 runner using the exact released SHA and an existing project directory; do not delete native bookkeeping to evade the old runner.
- [ ] Require exit 0 and `status: updated`, version `1.3.3`, expected SHA and successful built-in catalogue/MCP health checks; retain the backup receipt privately.
- [ ] Verify installed approved instructions and model observation, and report release URL, checks and installation outcome.
