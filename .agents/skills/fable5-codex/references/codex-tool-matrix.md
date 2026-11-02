# Codex tool matrix

This reference maps the stable workflow categories from the Fable 5 archive to the current Codex runtime. Tool names and connector schemas can change; the live registry and current skills are always authoritative.

| Workflow need | Codex family | Use it for | Guardrails |
| --- | --- | --- | --- |
| Orchestration | functions.exec | Batch independent calls and compose results | Keep dependent mutations sequential; do not print secrets or large opaque payloads |
| Shell execution | functions.exec_command, functions.write_stdin | Read the workspace, run bounded commands, inspect test output | Use the task workspace; avoid destructive commands unless authorized |
| Focused editing | functions.apply_patch | Small, reviewable repository edits | Preserve unrelated changes and review the resulting diff |
| Skill discovery | skills__list, skills__read | Discover and load relevant skills | Read before writing when a skill applies |
| Current web information | mcp__codex_apps__search_service_web_run | Search and open current sources | Use primary sources for technical claims; cite retrieved sources |
| GitHub | mcp__codex_apps__github_* | Read repositories and PRs, create branches/files/commits/PRs | Inspect current head and use the target branch explicitly |
| Browser interaction | mcp__cua_repl | Direct interaction with a requested or authenticated web UI | Do not use it for ordinary information lookup |
| Generated images | image_gen__imagegen | Create or edit raster visuals | Preserve transparency only when requested; inspect source images before editing |
| Local image inspection | view_image | Inspect images already on disk | Use only when visual inspection is needed |
| Parallel review | collaboration.* | Independent audit, review, or research | Avoid parallel writes to the same file or branch |
| Durable files | openai-library:library | Save user-facing artifacts durably | Read the Library skill before using it |

## Decision pattern

1. Identify the user's outcome and the smallest tool family that can complete it.
2. Prefer a purpose-built connector or skill over browser automation.
3. Use read-only calls to establish facts before mutations.
4. For mutations, keep the sequence explicit and inspect the returned state.
5. Report the tool result, not an assumption about what should have happened.

## GitHub write sequence

Read repository metadata and target head, create a branch, write or update files sequentially, inspect the branch diff, run available checks, then create the pull request. Do not issue concurrent updates to the same path. Do not merge automatically.
