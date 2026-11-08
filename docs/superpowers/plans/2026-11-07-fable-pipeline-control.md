# Fable Pipeline Control Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Exercise the installed Fable and Gigma Superpowers pipeline on a real standalone local path normalizer and CLI, with independently reviewable evidence.

**Architecture:** One pure function normalizes caller-supplied strings; a thin CLI translates JSON stdin/stdout and errors. The sample is not part of the plugin or a filesystem security boundary.

**Tech Stack:** Python standard library, `unittest`, existing Codex/Fable MCP and Superpowers tools.

**Spec:** `docs/fable-pipeline-control-design.md`.

## Global Constraints

- Follow the spec contract exactly, including rejection of Windows drive prefixes and preservation of meaningful spaces.
- Work in the existing `D:/GitHub/claude-fable-5-system-prompt` checkout; no worktree, repository copy, aliases, network calls by the sample or production/package changes.
- No edits to skills, helpers, installed packages, global config, existing evidence, external services or project memory. No push, PR, deploy or install.
- Exactly six planned committed outputs: `docs/fable-pipeline-control-design.md`, `docs/superpowers/plans/2026-11-07-fable-pipeline-control.md`, `tests/pipeline_control.py`, `tests/test_pipeline_control.py`, `tests/test_pipeline_control_cli.py`, and `docs/fable-pipeline-control-evidence.md`. The first two are already created. Preserve unrelated dirty files.
- Use explicit implementer `gpt-6.1-terra`, `reasoning_effort="high"`, `fork_turns="none"`; independent reviewers `gpt-6.1-sol`, `reasoning_effort="xhigh"`, `fork_turns="none"`. No silent model or workflow substitution. Workers do not spawn agents.
- **Blocked pending Art's exact authorization:** create one ordinary `codex/` branch in this checkout; stage and commit only the design, plan and three implementation/test files in scoped commits, plus `docs/fable-pipeline-control-evidence.md` in a separate final scoped commit (six paths total); and create the SDD artifacts specified below. Without that authorization do not invoke SDD scripts or write implementation; do not silently drop their review/commit gates.
- Full existing suites that create temporary test-fixture skill copies, local fixture repositories, symlinks or local package/build outputs are **blocked pending a separate explicit exception**. That exception covers fixtures only: it never authorizes a real plugin install or network/external writes. Do not emulate or bypass those checks.

## Review Focus

- Absolute paths and Windows drive-relative prefixes: Task 1 rejects `/a`, `\\a`, UNC, `C:foo`, and effective prefixes `./C:foo` and `a/../C:/x`.
- Traversal and an empty normalized result: Task 1 rejects `../a`, `a/../../b`, `.`, and `a/..`.
- Separators and ordering: Task 1 tests mixed/repeated separators, stable exact-case deduplication and an empty list.
- Whitespace and types: Task 1 preserves `" a /b "` and rejects whitespace-only, NUL, non-list and non-string inputs.
- CLI failures and streams: Task 2 tests malformed and excessively nested JSON, invalid list members and rejected paths with exit 2, one stderr line, empty stdout, no traceback and no echoed sensitive sentinel; valid JSON gets one newline and exit 0.

## Pipeline, gates and evidence

1. Recheck exact checkout, branch, HEAD and dirty state. Apply `using-git-worktrees` Step 0 including submodule guard; Art's explicit no-worktree preference means stay in the existing checkout and create no worktree. Discover and read installed Fable 1.3.5, applicable bootstrap/router, and enabled `superpowers@gigma-skills` via actual current-chat Fable MCP `search_skills`/`read_skill` with project cwd, pagination, identity, partial and content-hash checks. Distinguish actual native chat calls from direct stdio smoke and documented live-catalogue fallback: only actual chat calls prove chat integration. Record current-turn runtime model/effort evidence separately from requested dispatch arguments; neither is inferred from a prompt.
2. Have an independent Sol/xhigh reviewer check this design and plan before implementation. Reuse the approved plan; do not rerun equivalent planning. Apply project/feature gates and explicit permissions. If Art does not approve the exact branch/commit/artifact risk, stop as blocked.
3. With authorization, record BASE, create the ordinary branch, and commit the design and plan as a scoped baseline. Before Task 1 run and record the full existing Python and MCP suites described below on the baseline after the exact fixture exception; a denied, unavailable, skipped or failed full suite is a named blocker, not a pass. For each sequential task: generate a task brief, dispatch a fresh isolated Terra/high implementer, record the actual failing and passing test output and report, commit only that task's files, then obtain independent spec and quality reviews from a fresh isolated Sol/xhigh task reviewer. Fix in scope and re-review before the next task. Do not claim a role ran without actual receipts.
4. Run full existing Python and MCP suites again on final implementation contents, plus the safe task checks below, then a fresh independent isolated Sol/xhigh whole-branch review. Record exact HEAD, actual agent IDs and roles, command/exit evidence and limitations in the final evidence report; commit that report only if the same explicit authorization covers it. Apply `finishing-a-development-branch` locally: Art's chosen boundary is Option 3, keep branch as-is; retain evidence and do not delete workspace. No external writes.

Run the complete applicable implementation lifecycle, including its design, plan, implementation, independent review and verification gates. Superpowers skills for alternative or conditional circumstances are not a checklist of all 15 skills: use them when their actual conditions apply, and record the selection and any blocked gate.

The plan writer and preflight reviewer are preparation roles, not the Task 1 implementer or reviewer. Task 1, Task 2 and whole-branch review are distinct assignments with fresh isolated agents. For corrections and rechecks of the same assignment, resume its original implementer or reviewer using `followup_task`; this preserves Art's reuse preference without substituting a reused context for a required fresh one. Each reviewer remains independent of the implementer. Maintain a preflight ledger table with separate rows for Task 1, Task 2 and their shared interface; do not mark a stage passed while its evidence or any required check is blocked.

| Preflight scope | Required evidence before execution | Status |
| --- | --- | --- |
| Task 1: pure normalizer | Approved scope, baseline suites, explicit executor and reviewer | Pending |
| Task 2: CLI | Task 1 review and committed interface, explicit executor and reviewer | Pending |
| Shared interface | Signature and error/stream contract agree across both briefs | Pending |

The installed SDD `sdd-workspace` creates `.superpowers/sdd/2026-11-07-fable-pipeline-control/`, a `plan-path` marker and `.superpowers/sdd/.gitignore`; collisions can add the parent name or a numeric suffix. `task-brief` defaults to `task-1-brief.md` / `task-2-brief.md`; implementer reports use corresponding `task-N-report.md`; `review-package` writes `review-<base7>..<head7>.diff`, and the lifecycle requires its progress ledger. Retain `observables.jsonl` (sanitized event receipts), `model-receipts.json` (actual runtime evidence and requested dispatch settings labelled separately), `commands.log` (commands, outputs and exits) and `artifact-manifest.sha256` (paths and hashes) in that workspace. No raw private reasoning or copied session transcripts. Retain actual paths and hashes, never guess collision resolution. These evidence files, workspace, marker and ignore file require Art's explicit authorization. Do not overwrite an existing workspace or create copies, links or worktrees.

Safe checks on unchanged existing inputs: `python -B scripts/verify_codex_skill.py`; with `PYTHONDONTWRITEBYTECODE=1` and `PYTHONUTF8=1`, `python -B -m unittest discover -s tests -p test_behavior_evaluation.py -v`; `node --test mcp/test/search.test.mjs`; and the new task-specific `unittest` commands below. Inspect actual exit codes. `scripts/evaluate_behavior.py --run-model --model gpt-6.1-terra --reasoning-effort high --judge-model gpt-6.1-sol --judge-reasoning-effort xhigh --output <approved-absolute-output>` runs two real CLI model calls, writes temporary schema/response files and event logs, and tests proposed action plans rather than this actual workflow; do not treat it as end-to-end proof or run it without approved output paths and model-cost scope.

Existing full Python command `python -m unittest discover -s tests -v` creates temporary copies of `.agents/skills`, extracts package ZIPs and modifies the extracted test fixtures. Existing MCP command `cd mcp && npm test` creates temporary skill/package and bundled-file copies, local fixture Git repositories, a file symlink and mock installer/update fixtures; these fixture updates are not a real plugin installation. These are separate from the pure sample tests; run only after Art explicitly permits those exact temporary fixture copies, local fixture repositories, symlink and local package/build outputs. The exception does not authorize a real plugin install, remote Git/network writes or external writes. Do not run `npm ci`, build, `mcp/test/native-update.mjs` rehearsal or any real install as an implicit substitute. Reinspect the tests and runtime before execution and stop if any would use a real account, network write or actual installed package.

### Task 1: Pure normalizer

**Files:** Create `tests/pipeline_control.py`, `tests/test_pipeline_control.py`.

**Interfaces:** Produces `normalize_paths(paths: list[str]) -> list[str]`; consumes only in-memory Python values. Invalid input raises `ValueError` as specified.

- [ ] Write focused tests covering each Review Focus item owned by Task 1, including `['a/./b', 'a\\b', 'A/b', 'x/y/../z'] -> ['a/b', 'A/b', 'x/z']`; `[] -> []`; `[' a /b '] -> [' a /b ']`; and each rejected case independently.
- [ ] After writing tests, if the module does not exist, create only a no-behavior `pass`/`return None` function scaffold; then run `python -B -m unittest discover -s tests -p test_pipeline_control.py -v` with bytecode disabled. Record exit/output and confirm actual assertion **FAIL** results (`None` differs from expected output or `assertRaises` is not raised). `NotImplementedError` is a unittest ERROR; import failures, syntax errors and command errors are not valid red results.
- [ ] Implement only `normalize_paths` in `tests/pipeline_control.py` with no filesystem, network, shell or global-state operations.
- [ ] Run the same command and record its passing exit/output. Inspect the scoped diff and stage/commit only these two files if Art has explicitly authorized commits.
- [ ] Obtain independent Sol/xhigh spec and quality review and close any in-scope findings before Task 2.

### Task 2: JSON command

**Files:** Modify `tests/pipeline_control.py`; create `tests/test_pipeline_control_cli.py`.

**Interfaces:** Consumes Task 1's `normalize_paths(paths: list[str]) -> list[str]`; CLI reads a JSON value from stdin and emits the streams and exit codes in the spec.

- [ ] Write subprocess tests for valid `['a/./b', 'a\\b']`, malformed JSON, excessive JSON nesting causing `RecursionError`, a JSON object, a list containing a number, and an escaping path. Include an invalid input with a sensitive sentinel. Check exit code, exact JSON value and trailing newline on success; on failure check exit 2, empty stdout, exactly one stderr line, no traceback and no sentinel echoed.
- [ ] Run `python -B -m unittest discover -s tests -p test_pipeline_control_cli.py -v` with bytecode disabled and record the failing exit/output before implementation. Confirm an assertion fails because CLI behavior is absent, not because the test, import or command is broken.
- [ ] Add the CLI entry point to the same module without filesystem or network access.
- [ ] Run both task-specific test commands and record passing exits/output. Inspect the scoped diff and stage/commit only the two task files if Art has explicitly authorized commits.
- [ ] Obtain independent Sol/xhigh spec and quality review, then the final verification and whole-branch review above.
