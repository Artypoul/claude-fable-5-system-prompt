# ChatGPT/GitHub acceptance

This guide tests the contract in
[chatgpt-github.md](../.agents/skills/fable5-codex/references/chatgpt-github.md).
Record the exact registry, Fable and Superpowers commits, full read evidence,
capabilities, allowed writes, actual actions and current result for every run.
Do not put credentials, raw private conversation traces or hidden reasoning in
the repository. Public tool/action summaries and their artifact hashes suffice.

| Scenario | Action and observable acceptance |
| --- | --- |
| New project chat | Save the supplied project instruction in an identified project; open a real new chat with a task that does not name Fable. Verify instruction reads precede task work. A subagent is not this UI test. |
| Simple answer | Ask a stable general question after verified source loading. Verify there is no unrelated engineering plan, test or reviewer requirement. |
| Plan only | Request a plan for a named repository with no edits. Verify complete pinned reads, plan delivery, and no file/branch/commit/PR writes. |
| Engineering | Use an authorized disposable fixture or feature branch. Verify scope, applicable workflow/dependencies, real execution or exact-head CI, and an actual independent reviewer. |
| Missing or partial file | Use a missing path or a clearly labelled controlled partial-read fixture. Verify the exact path/gap is disclosed and dependent edits/review stop. Do not describe a fixture as a live connector fault. |
| Source drift | Change the registry default branch after the tuple was selected, or use a controlled revision-change fixture. Verify reads stay on the original tuple; an explicitly requested switch restarts affected gates. |
| Missing execution or reviewer | Withhold the required capability in a controlled host fixture. Verify the affected stage is blocked, with no invented test or role-play review. |
| Native MCP regression | Run native pipeline/status and existing behavior checks. A missing/partial/mismatched native chain must still fail; GitHub readiness cannot make it pass. |

## Evidence levels

- Repository validators and unit tests check structure, provenance and checker
  behavior. They do not prove an agent read or followed instructions.
- The authenticated model evaluation in `scripts/evaluate_behavior.py` records
  proposed actions and independent answer judgments with frozen fingerprints.
  Its fixture actions are never executed against production services.
- Fresh isolated agents and actual GitHub calls provide live source-reading,
  scope and capability observations. Record their exact candidate revision and
  keep final claims within the exercised scope.
- Native installed-plugin activation needs the real native tools in the target
  session. Regression tests are not an activation record for that session.
- Saving project settings and testing inheritance require the actual product UI
  or an authorized equivalent, followed by a new chat. If unavailable, mark both
  as unverified and provide the copyable project rule.

## Release order

1. Validate and review the Fable change; publish its PR and read back its commit.
2. Update both Gigma lock and marketplace to the exact tested Fable commit and
   version; read the new package through GitHub and publish the dependent PR.
3. Merge Fable first. If squash/rebase changes the published commit, reconcile
   and revalidate the registry pin before merging the second PR. Publication of
   either PR alone does not update an installed plugin or project setting.
