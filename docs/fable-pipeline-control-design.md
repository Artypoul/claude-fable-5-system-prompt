# Fable pipeline control: design

## Purpose and boundary

Exercise the installed Fable 5 and Gigma Superpowers workflow on a small, real local programming task. The output is a standalone control sample and its evidence, not a Fable plugin feature or a security boundary for real filesystem access. The sample performs no filesystem or network access. No skills, helpers, global configuration, installed plugins or published packages are changed; there is no push, PR, deployment or installation.

The proposed implementation is a pure Python function and a JSON stdin/stdout command in one ordinary test-area module. An alternative is to change the production MCP search API, but that would alter a live contract solely for a workflow experiment. A test-only assertion without implementation would not exercise a real red-to-green change. The standalone sample meets the stated control goal with a smaller boundary.

## Contract

`normalize_paths(paths: list[str]) -> list[str]` accepts a list of relative path strings and returns stable, case-sensitive, deduplicated normalized paths. The first occurrence determines order. Both `/` and `\` are separators; repeated separators and `.` segments are removed; internal `..` removes one preceding segment. Join remaining segments with `/`.

Reject the entire input with `ValueError` if the input is not a list, any element is not a string, is empty or whitespace-only, contains NUL, starts with `/` or `\` (including UNC), starts with a Windows drive prefix such as `C:` or `c:relative`, escapes above root, or normalizes to no segments. Also reject an effective drive prefix exposed at the start by normalization, such as `./C:foo` or `a/../C:/x`. Preserve meaningful spaces inside path segments, including leading or trailing spaces in an otherwise non-whitespace path. An empty input list is valid and returns `[]`. Case is preserved and comparisons are exact; no filesystem resolution, case folding or Unicode normalization occurs.

When run as a CLI, read one JSON value from stdin and call the function. A valid JSON list emits a JSON list and one newline to stdout, exits 0 and emits no stderr. Invalid JSON, excessively nested JSON causing `RecursionError`, or invalid input emits a single-line error to stderr, exits 2, emits no stdout and exposes no traceback. Error wording may be generic; it must not echo input, including a sensitive sentinel supplied in invalid input.

## Acceptance and evidence

Two sequential, independently reviewed tasks cover the function and the CLI. Each must show the old state failing a focused test, the minimal change, a passing test and an independent review. The final report records actual Fable MCP discovery/read receipts, source identity, project bootstrap/router, chosen Superpowers lifecycle, concrete agent IDs and requested model/effort/context, plan and review gates, test outputs, hashes and local handoff. Proposed actions or model-generated plans are not evidence of execution. A missing required tool, role or gate remains an explicit blocker.

Implementation and documentation outputs are restricted to the explicit paths named in the plan plus specifically approved SDD evidence files. Branch creation, commits and creation of SDD workspace artifacts are pending separate explicit authorization; full suites that copy skill packages or create links also require the exact exception described in the plan. No source output is authorized merely by this document.
