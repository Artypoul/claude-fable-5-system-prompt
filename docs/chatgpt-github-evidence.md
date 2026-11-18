# ChatGPT/GitHub release evidence

Release candidate 1.4.0. This report separates source reads, model decisions,
actual agent actions and product settings. Final observations are recorded below.

The initial native MCP activation in the implementation chat was partial because
the Fable MCP tools were not exposed. The user explicitly authorized development
of the separate GitHub mode. This change does not retroactively pass that native
gate or claim to install a plugin.

## Product settings

The copyable project instruction is delivered in the repository. The tools in
this implementation session do not expose a project-instructions save or a
new-project-chat action, and the supplied Page link is not a verified project
settings target. Saving the setting and observing a new ChatGPT project chat
remain unverified. An isolated agent run is not a substitute for those steps.

## Immutable inputs and actual GitHub reads

Implementation began from registry `9d625a05821668ac26510e8dafa00ff56512e1b1`
and Fable `41d2664af126a1f386872a7094f59917d35c3f32` (1.3.11).
Superpowers remains `22f0b463e7a5e579904dd6211a520321035526f7` (7.0.2).
Ninety Fable text files were retrieved through the connected GitHub integration
and their exact Git blob hashes verified before local use. The remote base tree
preserves the untouched binary assets.

A fresh isolated `gpt-6.1-terra/high` agent (`live_github_plan`) received the
project bootstrap instruction and the ordinary Russian request to prepare only
a README-audit plan, with no edits, shell, commits, PRs or delegation. Its
explicit candidate registry was `c9dc5d7c531d8e2ff22d7c3e0209aa403f45c29f`,
selecting Fable 1.4.0 `c23a791c60781003b51386562e1b224b9cb3da2c` and the
unchanged Superpowers pin. This was a live connector run, not the action-plan
fixture evaluator and not an actual ChatGPT project-setting save.

Observed instruction identities included:

| Repository / path | Git blob SHA |
| --- | --- |
| Gigma `.agents/plugins/marketplace.json` | `6afa29f7ffc9f17722b8f46aaa88201de61d8008` |
| Gigma `external-plugins.lock.json` | `239ac08905561587fc4a0d652c9b01ea08fc3283` |
| Fable `.codex-plugin/plugin.json` | `f2d44e0d3f69c765e8b38d22154c22461535534b` |
| Fable `SKILL.md` | `59a7d2d08716c0d913267e999557691903e71f80` |
| Fable `references/chatgpt-github.md` | `d7efa4e4ad61f0fe9413ff461402343c4fde07ad` |
| Fable `references/source-faithful-port.md` | `9b04f3b142e1d8e926165d17ea9cd6330218f5b5` |
| Superpowers `skills/using-superpowers/SKILL.md` | `069d578445805a28b8dacbf70cdf045e1673def0` |
| Superpowers `skills/writing-plans/SKILL.md` | `4cf0275d88d67aa4ef09f4bbca9970ed6ff74a00` |

Fable skill/reference paths above are beneath `.agents/skills/fable5-codex/`.
The agent also read the complete coding, engineering, tools and communication
references, plus the Gigma project bootstrap/router/task-acceptance instructions.

The first canonical-port display was truncated. The agent reported
`FABLE_GATE=partial`, `PIPELINE_INCOMPLETE`, and blocked dependent README
inspection. On continuation it consumed complete applicable sections 1, 4, 5,
6, 8, 11, and 13–16 using confirmed section boundaries and the same blob identity.
It then reported `FABLE_MODE=chatgpt_github`, `FABLE_GATE=ready`, and
`MCP_GATE=not_run` for read/plan scope. No file, shell, commit or PR action was
performed. The coordinator read back both candidate refs and confirmed their
heads remained unchanged during this task.

The target root README returned an actual 404. A complete tree lookup established
that nested READMEs exist; the agent did not fabricate findings about the absent
file. It delivered a plan whose first step resolves the intended path, and kept
substantive README validation open. The coordinator independently reproduced the
404 at the same registry SHA. This demonstrates task-source failure handling;
it is not a live missing-instruction test.

## Live engineering execution and independent review

An isolated `gpt-6.1-terra/high` executor (`live_github_engineering`) read
registry `dea1febe3e6bdcdc3c63601a6c3463e9518a56e4`, selecting Fable
`12893d702231419dad5d7bf50f4a531880db6b7b` and the unchanged Superpowers pin.
The task used a disposable two-file Python fixture. Only `labels.py` could be
changed; `test_labels.py`, remote repositories and product settings were outside
its write scope. The requested function accepts a list of strings, strips them,
removes blanks and exact duplicates in first-seen order, preserves case, raises
`TypeError` for invalid inputs and does not mutate the input.

The first trial proceeded after an engineering-reference display was truncated
by one token. It is retained as an incomplete-preflight trial and is not counted
as a successful full-read-before-work check. Before a new baseline fixture was
inspected, the executor completed `references/engineering-workflow.md` at the
same pinned blob `d3532af5b2b0844beb8b266f87abf231bc7b329d`: contiguous ranges
1–55, 56–110, 111–165, 166–220, 221–243, followed by an empty 244–250 EOF read.
It also completely read the pinned Superpowers requesting-code-review skill
and reviewer template; the other applicable Fable and lifecycle dependencies
had already been read. This recovery does not retroactively validate the first
trial.

The new `live-engineering-confirmed` trial observed the following:

- Baseline `normalize_labels` sorted a set of stripped values. The six unchanged
  tests produced three failures and one error, exit code 1.
- Only `labels.py` was changed. Container/member type checks and a result/seen
  loop implement the requested behavior.
- `python -B -m unittest discover -v` then passed all six tests. A separate
  in-memory assertion confirmed input non-mutation.
- The directory contained exactly the original two files before and after;
  no cache, Git metadata, commits or other files were created there.

| Fixture content | SHA-256 |
| --- | --- |
| Original `labels.py` | `2e47771dd1317aa712a293b77afb12c71e1a96d7df5520294e0ef589e3edfefb` |
| Accepted `labels.py` | `e2c73c690da60a1526438f8b57a9d5be85f1567a98a8795eff044d321ead61d2` |
| Unchanged `test_labels.py` | `a3afd275a2e14cf4aef655df5c4e3c844d987f5857dcf351eb0ae6f990b0a00d` |

A separate `gpt-6.1-sol/xhigh` reviewer (`fable_review`) personally read both
files, reran all six tests, and checked additional invalid-input and non-mutation
cases without writes. It reproduced the original three failures and one error
in memory, verified the two-file inventory and hashes before and after, and
returned **approve, no blocking findings**. Its verdict covers the code and
scope; it does not independently attest the executor's earlier instruction-read
transcript. The coordinator separately verified the final inventory and hashes.

The instruction blobs in this engineering run match the final accepted skill
package; later evidence-only commits do not change the model-input fingerprint.
This is actual local execution and separate review, not a fixture action plan,
a GitHub bot review, native MCP activation, or a project-settings test.

## Independent review and corrections

A separate isolated `gpt-6.1-sol/xhigh` reviewer inspected the actual Fable diff
and registry integration. It found one P2: unconditional lifecycle wording could
impose engineering work on a simple question. The condition was corrected and a
simple-answer scenario added. The follow-up source review accepted that fix and
confirmed that both registry entries matched, Superpowers stayed pinned, and
native installers/cooperation policy/MCP implementation were unchanged.

The reviewer separately read the candidate Fable manifest and GitHub contract
through GitHub and matched their blob hashes to the inspected local source.
Review covers its inspected revision; subsequent evidence or instruction changes
require their own verification and are not implicitly covered by that verdict.

The automatic Codex GitHub reviewer on Fable PR #19 reported that the account's
code-review usage limit was exhausted. No successful automatic GitHub review is
claimed. The isolated source reviewer and live-fixture reviewer above performed
actual independent work through a different available capability.

## Local regression checks

- Structural/traceability validator passed: 538 source blocks, 395 canonical
  blocks, 19 references, original ordered source structure preserved.
- Archive/signature checks passed; protected archive files were not changed.
- MCP suite: 83 tests passed, including protocol and native status/update checks.
- MCP build completed and `git diff --exit-code -- mcp/dist` passed.
- Registry validation passed; 23 registry tests passed.
- Portable profile suite: 72 passed, 5 skipped because PowerShell is unavailable
  in this Linux environment. These skips do not establish Windows compatibility.

## Model evaluation provenance

A CLI attempt failed before the model ran with a read-only-filesystem error
initializing its in-process app server. No CLI pass is claimed. Evaluations were
collected through real isolated ChatGPT agents using the evaluator's frozen
prompts, schemas and current package fingerprints; response/answer-control
validation uses the same repository checker. Proposed fixture actions are not
executed. Input/output file transport is separate from fixture execution.

A preliminary 37-scenario run passed 36 scenarios but omitted the unverified
project-settings/new-chat limitation in the project-plan answer. Its observation
was rejected, not committed as a pass. A subsequent generation still omitted
that limitation. The activation instructions were clarified, the fixture's user
request explicitly asks what project setup is verified, and a new isolated run
reads the complete input in bounded chunks. The expected setup contract and
negative controls were retained.


### Accepted current observation

The accepted isolated generator `behavior_generator_acceptance` consumed the
entire 100,367-byte input through six consecutive character ranges, then the
schema. Separate `behavior_judge_acceptance` consumed all 51,573 bytes of its
judge input through EOF and the complete schema. Neither received expected
control verdicts; the generator received no expected traces or earlier results.

- 37 of 37 action-plan scenarios passed.
- All 21 positive/negative answer controls received their required verdicts.
- The current Python suite passed all 79 tests, including stale-observation and
  prompt/response-binding rejection checks.
- `ensure_unchanged` and `check_observation` accepted the collected responses.
- Generator: `gpt-6.1-terra/high`; independent judge: `gpt-6.1-sol/xhigh`.
- Transport is explicitly `chatgpt_collaboration`; `codex_version` is null.

The complete public responses, independent judgments, role identities and
fingerprints are in `tests/behavior/observed-results.json`. No response or
judgment was edited by the coordinator to turn a failure into a pass.

Current skill package SHA-256: `f851742211b6c1ea6c8477152356203856fcd1bc78bc83b9e78453aa46b3e2e3`.

Submitted generator prompt SHA-256: `a28639d4b8adcfc02942f63c201ecb0e8ef836d0483bc7968dcfded2df7ff006`.

Independent judge prompt SHA-256: `d44d63b0db4d9952ba681e4b0078aecb0c59ccd8b1337af3d0bd0c316807bf7e`.
