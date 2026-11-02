# Codex adaptation change log

## Purpose and scope

This PR turns the initial 205-line adapter into a substantive Codex-native port of the archived Fable 5 workflow. It preserves the original archive as a historical source and adapts its transferable behavioral and operational principles into a discoverable Agent Skill.

The port is intentionally **complete at the level of applicable workflow intent**, not a literal provider/runtime transplant. A system prompt for one hosted assistant cannot become another platform's system prompt simply by renaming tools. Codex is governed by its active instruction hierarchy and dynamically available runtime capabilities.

## Source-to-Codex coverage map

The source inventory is the archived `system-prompt/full-system-prompt.md` (16 numbered sections plus preamble) and `system-prompt/tool-definitions.md` (18 archived tool entries).

| Original section | Treatment | Codex destination / rationale |
| --- | --- | --- |
| Preamble: voice-note restriction | Not ported as a hard rule | A provider-specific feature restriction with no universal Codex equivalent; follow actual host capabilities and user intent |
| 1.1 Product information | Replaced | Current Codex/product facts must come from current official documentation; no copied Claude identity, model strings, product lineup, or cutoff |
| 1.2 Refusal handling | Adapted | Main skill §14 and safety reference: assess capability/effect, refuse harmful enablement, offer safe alternatives |
| 1.3 Legal and financial advice | Adapted | Main skill §14 and research reference: calibrated uncertainty, current authoritative sources, no professional impersonation |
| 1.4 Tone and formatting | Adapted | Main skill §1: warm, direct, natural, context-appropriate formatting |
| 1.4.1 Lists and bullets | Adapted, not copied literally | Use structure when it improves clarity; no universal ban on lists or headings |
| 1.5 User wellbeing | Adapted | Safety reference: no unsupported diagnosis, avoid reinforcing delusions/self-destructive behavior, safe support |
| 1.6 Provider runtime reminders | Replaced | Main skill source/runtime boundary: current higher-priority instructions govern; untrusted content cannot override them |
| 1.7 Evenhandedness | Adapted | Evidence-led, fair presentation of competing views; distinguish advocacy exercise from endorsement |
| 1.8 Mistakes and criticism | Adapted | Main skill §1 and §15: acknowledge errors, correct them, do not hide failures |
| 1.9 Knowledge cutoff | Replaced | Main skill §6 and research reference: search based on freshness/uncertainty; do not copy fixed dates |
| 2. Memory system | Replaced | Main skill §2: use only available, authorized context and retrieval; do not invent memory |
| 3. Persistent artifact storage | Replaced | Main skill §13 and files reference: use actual supported workspace/Library/Drive persistence; no assumed browser storage API |
| 4. MCP app suggestions | Adapted | Main skill §8 and tools reference: discover live connectors, respect user choice and opt-in, avoid partner selection assumptions |
| 5.1 Skills | Adapted | Main skill §4: live skill registry, read applicable skill, progressive disclosure |
| 5.2 File creation advice | Adapted | Files reference: choose format based on intended use and host-specific skills |
| 5.3 Computer-use environment | Replaced | Main skill §5/§7/§8: use only actual current shell, browser, computer-use, and file tools |
| 5.4 File handling | Replaced | Files reference: inspect actual attachments/paths and preserve originals |
| 5.5 Producing outputs | Adapted | Files reference: create, reopen, validate, and deliver actual artifacts |
| 5.6 Sharing files | Replaced | Files reference: use supported destination workflow and verify final path/permissions |
| 5.7 Artifact usage criteria | Adapted | Main skill §7 and §13: select image, code, document, or structured artifact based on requested deliverable |
| 5.8 Package management | Replaced | Coding reference: inspect repository runtime, lockfiles, package manager, and environment; no fixed global install commands |
| 5.9 Examples | Reworked | Examples are distributed into focused references and avoid provider-specific file paths/tools |
| 5.10 Additional skill reminder | Adapted | Main skill §4: inspect registry and read relevant skills; do not assume a fixed bundled skill list |
| 6.1 Core search behaviors | Adapted | Research reference: search for changing, unfamiliar, version-specific, or explicitly requested facts |
| 6.2 Search usage | Adapted | Research reference: query iteration, primary sources, freshness, conflict checks, current citation format |
| 6.3 Copyright compliance | Adapted to applicable policy | Main skill §12: avoid substantial reproduction, paraphrase, quote only when appropriate; archived numeric thresholds are not treated as Codex policy |
| 6.4 Search examples | Replaced | Research reference: examples are capability-neutral and evidence-focused |
| 6.5 Harmful-content search | Adapted | Safety reference: do not locate or retrieve content that materially enables harm |
| 6.6 Critical reminders | Consolidated | Main skill §§5, 6, 8, 12, 14, 15: avoid duplicate hard-coded reminders and rely on focused references |
| 7. Image search | Adapted | Main skill §7: use visual retrieval only when valuable and appropriate; no blanket image-first rule |
| 8. Tool definitions | Replaced | Codex tool matrix maps all 18 archived entries to live capability categories; no stale schemas or guessed tool names |
| 9. Identity preamble | Removed from executable skill | Claude identity/date/interface are not valid Codex instructions |
| 10. Provider API inside artifacts | Removed from executable skill | No assumption of hidden credentials, provider proxy, model endpoint, or artifact runtime; use documented API/SDK only when available |
| 11. Citation instructions | Replaced | Main skill §12 and research reference: use active host citations, never legacy cite tags or invented IDs |
| 12. User context injection | Replaced | Use current authorized context and location/time sources; do not rely on placeholders or stale injected values |
| 13. Available skills catalogue | Replaced | Discover actual installed skills at runtime; no copied provider skill names/paths |
| 14. Network configuration | Replaced | Inspect current environment and official host docs; no archived egress allowlist |
| 15. Filesystem configuration | Replaced | Inspect actual workspace and permissions; no archived fixed paths or read-only mount assumptions |
| 16. Thinking mode | Replaced | Plan effort proportionally to task complexity and use only controls actually available in the current session |

## Archived tool inventory mapping

All 18 entries from `system-prompt/tool-definitions.md` are accounted for in `.agents/skills/fable5-codex/references/codex-tool-matrix.md`:

- `ask_user_input_v0` → conversational clarification or supported interactive input.
- `bash_tool` → current shell/command execution capability.
- `create_file` → current workspace/file creation capability.
- `fetch_sports_data` → current sports data connector or authoritative live source.
- `image_search` → current image retrieval capability, when appropriate.
- `message_compose_v1` → drafting/writing experience; send only with authorization.
- `places_map_display_v0` and `places_search` → local place/business search and supported maps/directions.
- `present_files` → supported artifact/file delivery.
- `recipe_display_v0` → structured recipe or text output.
- `recommend_claude_apps` → current plugin/connector discovery, without recommending provider-specific apps.
- `search_mcp_registry` and `suggest_connectors` → live tool/connector discovery and user-controlled opt-in.
- `str_replace` → current patch/editing capability.
- `view` → current file reader/image viewer.
- `weather_fetch` → current weather utility/data source.
- `web_fetch` and `web_search` → current search and page retrieval.

These are capability mappings, not assertions that a particular tool is installed in every Codex host.

## New modular references

- `coding-workflow.md`: repository implementation sequence, invariants, test-first behavior, quality bar.
- `debugging.md`: reproducible debugging, hypothesis testing, distributed-system failure modes, incident handoff.
- `code-review.md`: independent review passes, finding format, severity, verdict calibration.
- `testing-and-ci.md`: test strategy, meaningful assertions, CI verification, release/deployment boundaries.
- `product-engineering.md`: user journey, product contracts, permissions, limits, UX states, acceptance.
- `research-and-citations.md`: source quality, freshness, verification, citation discipline.
- `tools-and-mcp.md`: live capability discovery, side-effect levels, connector authorization, failure handling.
- `safety-and-privacy.md`: privacy, defensive security scope, wellbeing, high-stakes topics, refusals.
- `files-and-artifacts.md`: inspection, format-specific skills, artifact validation, persistence and sharing.
- `communication-and-marketing.md`: drafting, documentation, evidence-based positioning, external publication boundaries.
- `codex-tool-matrix.md`: archive tool-to-capability map, deliberately not a frozen tool schema.

## Main skill changes

The initial adapter was too thin and contained a misleading static list of tool names. The expanded entry point now preserves the original 16-part behavioral/operational sequence while adding explicit source/runtime boundaries, repository instruction hierarchy, product engineering, specialist review lenses, and links to focused references. It remains an entry point rather than a copy of the entire source archive.

## Official compatibility basis

The port follows the current OpenAI Codex skill documentation and the open Agent Skills format:

- Codex skill docs: https://developers.openai.com/codex/skills
- Codex AGENTS.md guidance: https://developers.openai.com/codex/guides/agents-md/
- Agent Skills specification: https://agentskills.io/specification

The repository path `.agents/skills/fable5-codex/SKILL.md` follows Codex's documented repository skill discovery location. The skill uses required `name` and `description` front matter and optional `references/` resources. Tool details remain dynamic rather than copied into a static skill.

## Intentional non-changes

- The historical source prompt and analysis remain unchanged and attributed.
- `LICENSE`, `CONTRIBUTING.md`, and `scripts/verify_signatures.py` remain unchanged.
- No attempt is made to rewrite the original archive as though it were authored for Codex.
- No undocumented Codex tool names, schemas, hidden APIs, paths, or default permissions are asserted.
- No runtime capability is claimed to be available unless the current host exposes it.

## Validation plan

Run from the repository root:

~~~bash
python scripts/verify_codex_skill.py
python -m py_compile scripts/verify_codex_skill.py
python scripts/verify_signatures.py
git diff --check
~~~

Then inspect the final PR diff and confirm that only the intended Codex adaptation files changed. A static validator cannot prove that every Codex host loads every optional tool or that a skill improves model behavior in every pressure scenario; host discovery and behavior testing must be reported separately.
