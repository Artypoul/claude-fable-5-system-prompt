# Codex adaptation: changes and source-to-port decisions

## Source of truth

The source is the user's original fork at `9b00248c2f0dd60c12a718853580a5ec44a9edf0`. GitHub comparison confirmed that the upstream `KalarisLabs/claude-fable-5-system-prompt` main branch is identical to that commit. Its archived files, curation attribution, LICENSE, CONTRIBUTING.md and original signature checker remain unchanged. This establishes repository provenance, **not independent authentication of the claimed leaked system prompt**.

This review started from PR #1 head `9cad726cf92eb94365035a78c4a8464433cfeaef`. A reproducible CI snapshot at `0cbf368df2324f170d72d6aaf0750016b5304642` has tree `daad7fb16fd3bbccfc65b6fca6aca9a27d5f6cbe`, matched locally before editing.

## What was wrong and what changed

The old port had sixteen sections but not the original sixteen-section sequence. Its coverage table could list every heading while the actual runtime guidance lost body rules. The old validator passed after a source paragraph changed, a reference body was removed, a link was broken, a front-matter key was duplicated, or a stale tool name was added to the unchecked matrix.

1. **Original structure restored:** SKILL.md now follows the source's sixteen sections. The canonical `references/source-faithful-port.md` follows all 73 nested source headings, with individually located adaptations for every source body block. The earlier engineering-oriented structure is retained as an explicitly supplementary reference rather than passed off as the source structure.
2. **Useful details recovered:** sensitive-conversation nuance and anti-dependency, prompting/customization guidance, storage error distinctions and batching examples, named/internal/consumer connector branches, direct-answer versus artifact cases, current-role lookup, visual examples, and the complete application-API state/error/file workflow are present in the source-based port.
3. **Only incompatible bindings replaced:** model/product claims, dates, host-only schemas, credentials, mounts, rendering restrictions, hard-coded quotas and policy conflicts are not treated as Codex facts. The original implementations remain available unchanged for comparison. Section 10 is adapted, not deleted wholesale.
4. **Supplements reconciled:** remove the false ban on stating a verified model identity, blanket copyright prohibitions that ignored exceptions, and an over-broad retrieval restriction; distinguish direct internal connector use from choosing a commercial provider. Repair literal backslash-n formatting left by earlier edits.
5. **Checks made meaningful:** exact source blob pins; source block spans; real target anchors and body fingerprints; ordered source structure; actual local link resolution; reference-body checks; front-matter validation; legacy-regression checks including the matrix; negative regression tests; and GitHub Actions execution with reproducible evidence.

## Files and responsibilities

- `.agents/skills/fable5-codex/SKILL.md`: short entry point in the original section order.
- `.agents/skills/fable5-codex/references/source-faithful-port.md`: canonical source-based bodies, examples and eighteen capability adaptations.
- `.agents/skills/fable5-codex/references/engineering-workflow.md`: earlier engineering workflow retained as an addition.
- Existing specialist references: retained; narrowly corrected where they conflicted with the canonical port or contained formatting damage.
- `scripts/verify_codex_skill.py`: deterministic package, source-integrity and traceability validator; not a model-behaviour evaluator.
- `tests/test_codex_port.py`: positive and mutation-based regression tests.
- `.github/workflows/codex-skill-validation.yml`: read-only, pinned-action CI for the exact head, syntax, validator, regression tests, attribution, unchanged archive and whitespace.
- This file: separate human change list, schema disposition and machine-checked source decisions.

## Two review passes

**Pass 1 — source to port:** compared the original bodies and both tool catalogues, not just headings. Captured eight baseline regression failures (the unmodified package itself passed). Restored the original primary sequence and the missing source-based bodies. Each paragraph/list entry/example/schema block gets a source span and an explicit adaptation decision.

**Pass 2 — corrected port back to source and runtime:** re-read the adapted conditions, exceptions, examples and schema replacements, and checked the supplements for conflicts. Restored the pet-preference clarification example and made image-identification privacy explicit. Three additional mutation tests exposed unordered rule bodies, misrouted duplicate tool documentation, and invalid plain-YAML descriptions; those defects were fixed and the same tests rerun. The final local run passed all 24 tests, including the documented JSON-validation example. A separate automated reviewer is not implied by these two passes.

**Observed local checks:** Python compilation, the source/port validator, all 24 regression tests, the original attribution check, and whitespace checks were executed. The validator confirmed 10 unchanged protected files, 73 ordered source headings, 538 mapped source blocks, 395 canonical body anchors, 17 references and 18 tool families. Final remote CI evidence is recorded against the actual PR head in the PR handoff, rather than inferred from this document.

## Deliberate differences from the source

- Identity, product lineups, advertising statements, current office-holders, helplines, dates and fixed model IDs require current trusted context or authoritative sources.
- Tool schemas, argument limits, image display counts, storage quotas, network allowlists, mount paths, installed libraries and app catalogues are **provider-specific contracts**, not universal Codex behaviour. Preserve the operation's intent and check the active contract.
- Safety, political-content and copyright decisions follow active platform policy. Do not copy blanket bans on legitimate defensive security, all public-figure fiction, all copyrighted imagery, all poetry, or public-domain/user-provided text. Do not copy numerical quotation rules as legal facts.
- The source contradicts itself on list formatting, artifact thresholds, browser persistence and when to search. Preserve its useful purpose and document the reconciliation rather than enforce contradictory absolutes.
- A skill cannot grant hidden authentication, select internal thinking mode or make an unavailable tool callable. Application API examples are translated into documented integration steps and a local JSON-validation example, not fake SDK calls.

## Validation scope and limitations

The ledger below covers **source blocks**, including list entries, examples, schemas and navigation metadata; its count is not a count of independently tested model behaviours. A block can contain multiple related requirements. Fingerprints detect accidental deletion or drift; they do not prove semantic equivalence. The two manual review passes address meaning. No isolated-agent activation benchmark, private model test, or every-host compatibility test is claimed.

The validator intentionally accepts this repository's simple two-field scalar front matter; it is not a general YAML parser. Its legacy checks catch known regressions, not every conceivable invented tool name. The unchanged signature script checks attribution strings, not cryptographic authenticity; separate pinned blob checks and git diff establish archive preservation.

Official format references checked on 2026-11-02: [Codex skills](https://learn.chatgpt.com/docs/build-skills), [Codex project instructions](https://developers.openai.com/codex/guides/agents-md/), and [Agent Skills](https://agentskills.io/specification). The package uses `.agents/skills/`, required name/description metadata and progressive loading. No current product model or tool namespace is hard-coded.

Run from the repository root:

```sh
python3 -m py_compile scripts/verify_codex_skill.py
python3 scripts/verify_codex_skill.py
python3 -m unittest discover -s tests -v
python3 scripts/verify_signatures.py
git diff --check
```

## Heading correspondence

The canonical file follows these source headings in this exact order. Titles change only where provider identity or a non-portable tool binding requires it.

| Source heading | Canonical destination |
| --- | --- |
| Preamble: Voice Note Restriction | [Preamble: Supported Output Formats](.agents/skills/fable5-codex/references/source-faithful-port.md#f5-section-preamble) |
| 1. Claude Behavior | [1. Codex Behavior](.agents/skills/fable5-codex/references/source-faithful-port.md#f5-section-1) |
| 1.1 Product Information | [1.1 Product Information](.agents/skills/fable5-codex/references/source-faithful-port.md#f5-section-1-1) |
| 1.2 Refusal Handling | [1.2 Refusal Handling](.agents/skills/fable5-codex/references/source-faithful-port.md#f5-section-1-2) |
| 1.3 Legal and Financial Advice | [1.3 Legal and Financial Advice](.agents/skills/fable5-codex/references/source-faithful-port.md#f5-section-1-3) |
| 1.4 Tone and Formatting | [1.4 Tone and Formatting](.agents/skills/fable5-codex/references/source-faithful-port.md#f5-section-1-4) |
| 1.4.1 Lists and Bullets | [1.4.1 Lists and Bullets](.agents/skills/fable5-codex/references/source-faithful-port.md#f5-section-1-4-1) |
| 1.5 User Wellbeing | [1.5 User Wellbeing](.agents/skills/fable5-codex/references/source-faithful-port.md#f5-section-1-5) |
| 1.6 Anthropic Reminders | [1.6 Runtime Reminders](.agents/skills/fable5-codex/references/source-faithful-port.md#f5-section-1-6) |
| 1.7 Evenhandedness | [1.7 Evenhandedness](.agents/skills/fable5-codex/references/source-faithful-port.md#f5-section-1-7) |
| 1.8 Responding to Mistakes and Criticism | [1.8 Responding to Mistakes and Criticism](.agents/skills/fable5-codex/references/source-faithful-port.md#f5-section-1-8) |
| 1.9 Knowledge Cutoff | [1.9 Knowledge Cutoff](.agents/skills/fable5-codex/references/source-faithful-port.md#f5-section-1-9) |
| 2. Memory System | [2. Memory System](.agents/skills/fable5-codex/references/source-faithful-port.md#f5-section-2) |
| 3. Persistent Storage for Artifacts | [3. Persistent Storage for Artifacts](.agents/skills/fable5-codex/references/source-faithful-port.md#f5-section-3) |
| 3.1 Storage API | [3.1 Storage API](.agents/skills/fable5-codex/references/source-faithful-port.md#f5-section-3-1) |
| 3.2 Usage Examples | [3.2 Usage Examples](.agents/skills/fable5-codex/references/source-faithful-port.md#f5-section-3-2) |
| 3.3 Key Design Pattern | [3.3 Key Design Pattern](.agents/skills/fable5-codex/references/source-faithful-port.md#f5-section-3-3) |
| 3.4 Data Scope | [3.4 Data Scope](.agents/skills/fable5-codex/references/source-faithful-port.md#f5-section-3-4) |
| 3.5 Error Handling | [3.5 Error Handling](.agents/skills/fable5-codex/references/source-faithful-port.md#f5-section-3-5) |
| 3.6 Limitations | [3.6 Limitations](.agents/skills/fable5-codex/references/source-faithful-port.md#f5-section-3-6) |
| 4. MCP App Suggestions | [4. MCP App Suggestions](.agents/skills/fable5-codex/references/source-faithful-port.md#f5-section-4) |
| 4.1 Connector Directory First | [4.1 Connector Directory First](.agents/skills/fable5-codex/references/source-faithful-port.md#f5-section-4-1) |
| 4.2 After Search | [4.2 After Search](.agents/skills/fable5-codex/references/source-faithful-port.md#f5-section-4-2) |
| 4.3 Third-Party MCP App Tools Need Opt-In | [4.3 Third-Party MCP App Tools Need Opt-In](.agents/skills/fable5-codex/references/source-faithful-port.md#f5-section-4-3) |
| 4.4 When to Call a Third-Party MCP App Tool Directly | [4.4 When to Call a Third-Party MCP App Tool Directly](.agents/skills/fable5-codex/references/source-faithful-port.md#f5-section-4-4) |
| 4.5 What Not to Do | [4.5 What Not to Do](.agents/skills/fable5-codex/references/source-faithful-port.md#f5-section-4-5) |
| 4.6 What This Should Feel Like | [4.6 What This Should Feel Like](.agents/skills/fable5-codex/references/source-faithful-port.md#f5-section-4-6) |
| 5. Computer Use | [5. Computer Use](.agents/skills/fable5-codex/references/source-faithful-port.md#f5-section-5) |
| 5.1 Skills | [5.1 Skills](.agents/skills/fable5-codex/references/source-faithful-port.md#f5-section-5-1) |
| 5.2 File Creation Advice | [5.2 File Creation Advice](.agents/skills/fable5-codex/references/source-faithful-port.md#f5-section-5-2) |
| 5.3 High-Level Computer Use Explanation | [5.3 High-Level Computer Use Explanation](.agents/skills/fable5-codex/references/source-faithful-port.md#f5-section-5-3) |
| 5.4 File Handling Rules | [5.4 File Handling Rules](.agents/skills/fable5-codex/references/source-faithful-port.md#f5-section-5-4) |
| 5.5 Producing Outputs | [5.5 Producing Outputs](.agents/skills/fable5-codex/references/source-faithful-port.md#f5-section-5-5) |
| 5.6 Sharing Files | [5.6 Sharing Files](.agents/skills/fable5-codex/references/source-faithful-port.md#f5-section-5-6) |
| 5.7 Artifact Usage Criteria | [5.7 Artifact Usage Criteria](.agents/skills/fable5-codex/references/source-faithful-port.md#f5-section-5-7) |
| 5.8 Package Management | [5.8 Package Management](.agents/skills/fable5-codex/references/source-faithful-port.md#f5-section-5-8) |
| 5.9 Examples | [5.9 Examples](.agents/skills/fable5-codex/references/source-faithful-port.md#f5-section-5-9) |
| 5.10 Additional Skills Reminder | [5.10 Additional Skills Reminder](.agents/skills/fable5-codex/references/source-faithful-port.md#f5-section-5-10) |
| 6. Search Instructions | [6. Search Instructions](.agents/skills/fable5-codex/references/source-faithful-port.md#f5-section-6) |
| 6.1 Core Search Behaviors | [6.1 Core Search Behaviors](.agents/skills/fable5-codex/references/source-faithful-port.md#f5-section-6-1) |
| 6.2 Search Usage Guidelines | [6.2 Search Usage Guidelines](.agents/skills/fable5-codex/references/source-faithful-port.md#f5-section-6-2) |
| 6.3 Critical Copyright Compliance | [6.3 Critical Copyright Compliance](.agents/skills/fable5-codex/references/source-faithful-port.md#f5-section-6-3) |
| 6.4 Search Examples | [6.4 Search Examples](.agents/skills/fable5-codex/references/source-faithful-port.md#f5-section-6-4) |
| 6.5 Harmful Content Safety | [6.5 Harmful Content Safety](.agents/skills/fable5-codex/references/source-faithful-port.md#f5-section-6-5) |
| 6.6 Critical Reminders | [6.6 Critical Reminders](.agents/skills/fable5-codex/references/source-faithful-port.md#f5-section-6-6) |
| 7. Using Image Search Tool | [7. Using Image Search](.agents/skills/fable5-codex/references/source-faithful-port.md#f5-section-7) |
| 8. Tool Definitions (Full Descriptions and Parameter Schemas) | [8. Tool Definitions](.agents/skills/fable5-codex/references/source-faithful-port.md#f5-section-8) |
| 8.1 ask_user_input_v0 | [8.1 Clarification and interactive input](.agents/skills/fable5-codex/references/source-faithful-port.md#f5-section-8-1) |
| 8.2 bash_tool | [8.2 Shell execution](.agents/skills/fable5-codex/references/source-faithful-port.md#f5-section-8-2) |
| 8.3 create_file | [8.3 File creation](.agents/skills/fable5-codex/references/source-faithful-port.md#f5-section-8-3) |
| 8.4 fetch_sports_data | [8.4 Sports data](.agents/skills/fable5-codex/references/source-faithful-port.md#f5-section-8-4) |
| 8.5 image_search | [8.5 Image retrieval](.agents/skills/fable5-codex/references/source-faithful-port.md#f5-section-8-5) |
| 8.6 message_compose_v1 | [8.6 Message drafting](.agents/skills/fable5-codex/references/source-faithful-port.md#f5-section-8-6) |
| 8.7 places_map_display_v0 | [8.7 Maps and itineraries](.agents/skills/fable5-codex/references/source-faithful-port.md#f5-section-8-7) |
| 8.8 places_search | [8.8 Place search](.agents/skills/fable5-codex/references/source-faithful-port.md#f5-section-8-8) |
| 8.9 present_files | [8.9 File delivery](.agents/skills/fable5-codex/references/source-faithful-port.md#f5-section-8-9) |
| 8.10 recipe_display_v0 | [8.10 Recipes](.agents/skills/fable5-codex/references/source-faithful-port.md#f5-section-8-10) |
| 8.11 recommend_claude_apps | [8.11 Product and app recommendations](.agents/skills/fable5-codex/references/source-faithful-port.md#f5-section-8-11) |
| 8.12 search_mcp_registry | [8.12 Connector discovery](.agents/skills/fable5-codex/references/source-faithful-port.md#f5-section-8-12) |
| 8.13 str_replace | [8.13 Focused text editing](.agents/skills/fable5-codex/references/source-faithful-port.md#f5-section-8-13) |
| 8.14 suggest_connectors | [8.14 Connector selection](.agents/skills/fable5-codex/references/source-faithful-port.md#f5-section-8-14) |
| 8.15 view | [8.15 File and image inspection](.agents/skills/fable5-codex/references/source-faithful-port.md#f5-section-8-15) |
| 8.16 weather_fetch | [8.16 Weather](.agents/skills/fable5-codex/references/source-faithful-port.md#f5-section-8-16) |
| 8.17 web_fetch | [8.17 Page retrieval](.agents/skills/fable5-codex/references/source-faithful-port.md#f5-section-8-17) |
| 8.18 web_search | [8.18 Web search](.agents/skills/fable5-codex/references/source-faithful-port.md#f5-section-8-18) |
| 9. Identity Preamble | [9. Identity Preamble](.agents/skills/fable5-codex/references/source-faithful-port.md#f5-section-9) |
| 10. Anthropic API in Artifacts ("Claudeception") | [10. AI API in Applications](.agents/skills/fable5-codex/references/source-faithful-port.md#f5-section-10) |
| 11. Citation Instructions | [11. Citation Instructions](.agents/skills/fable5-codex/references/source-faithful-port.md#f5-section-11) |
| 12. User Context | [12. User Context](.agents/skills/fable5-codex/references/source-faithful-port.md#f5-section-12) |
| 13. Available Skills | [13. Available Skills](.agents/skills/fable5-codex/references/source-faithful-port.md#f5-section-13) |
| 14. Network Configuration | [14. Network Configuration](.agents/skills/fable5-codex/references/source-faithful-port.md#f5-section-14) |
| 15. Filesystem Configuration | [15. Filesystem Configuration](.agents/skills/fable5-codex/references/source-faithful-port.md#f5-section-15) |
| 16. Thinking Mode | [16. Thinking Mode](.agents/skills/fable5-codex/references/source-faithful-port.md#f5-section-16) |

## Schema disposition for all eighteen tools

These are **archived** field/constraint inventories, not callable Codex schemas. Every entry is replaced by the selected live tool's actual schema, with the operation semantics retained in the corresponding canonical 8.x section. Root and nested constraints remain in the unchanged source; the source digest pins the complete JSON, including fields not repeated in this display.

| Source tool | Input concepts | Required and constrained fields (archived) |
| --- | --- | --- |
| ask_user_input_v0 | questions | `$.properties.questions.items.properties.options.maxItems=4; $.properties.questions.items.properties.options.minItems=2; $.properties.questions.items.properties.type.default="single_select"; $.properties.questions.items.properties.type.enum=["single_select","multi_select","rank_priorities"]; $.properties.questions.items.required=["question","options"]; $.properties.questions.maxItems=3; $.properties.questions.minItems=1; $.required=["questions"]` |
| bash_tool | command, description | `$.required=["command","description"]` |
| create_file | description, file_text, path | `$.required=["description","file_text","path"]` |
| fetch_sports_data | data_type, game_id, league, team | `$.properties.data_type.enum=["scores","standings","game_stats"]; $.properties.league.enum=["nfl","nba","nhl","mlb","wnba","ncaafb","ncaamb","ncaawb","epl","la_liga","serie_a","bundesliga","ligue_1","mls","champions_league","tennis","golf","nascar","cricket","mma"]; $.required=["data_type","league"]` |
| image_search | max_results, query | `$.additionalProperties=false; $.properties.max_results.maximum=5; $.properties.max_results.minimum=3; $.required=["query"]` |
| message_compose_v1 | kind, summary_title, variants | `$.properties.kind.enum=["email","textMessage","other"]; $.properties.variants.items.required=["label","body"]; $.properties.variants.minItems=1; $.required=["kind","variants"]` |
| places_map_display_v0 | days, locations, mode, narrative, show_route, title, travel_mode | `$.$defs.DayInput.additionalProperties=false; $.$defs.DayInput.properties.locations.maxItems=50; $.$defs.DayInput.properties.locations.minItems=1; $.$defs.DayInput.required=["day_number","locations"]; $.$defs.MapLocationInput.additionalProperties=false; $.$defs.MapLocationInput.required=["latitude","longitude","name"]; $.additionalProperties=false; $.properties.days.anyOf[0].maxItems=30; $.properties.locations.anyOf[0].maxItems=50; $.properties.mode.anyOf[0].enum=["markers","itinerary"]; $.properties.travel_mode.anyOf[0].enum=["driving","walking","transit","bicycling"]` |
| places_search | location_bias_lat, location_bias_lng, location_bias_radius, queries | `$.$defs.SearchQuery.additionalProperties=false; $.$defs.SearchQuery.properties.max_results.maximum=10; $.$defs.SearchQuery.properties.max_results.minimum=1; $.$defs.SearchQuery.required=["query"]; $.additionalProperties=false; $.properties.queries.maxItems=10; $.properties.queries.minItems=1; $.required=["queries"]` |
| present_files | filepaths | `$.additionalProperties=false; $.properties.filepaths.minItems=1; $.required=["filepaths"]` |
| recipe_display_v0 | base_servings, description, ingredients, notes, steps, title | `$.$defs.RecipeIngredient.properties.unit.anyOf[0].enum=["g","kg","ml","l","tsp","tbsp","cup","fl_oz","oz","lb","pinch"]; $.$defs.RecipeIngredient.properties.unit.default=null; $.$defs.RecipeIngredient.required=["amount","id","name"]; $.$defs.RecipeStep.properties.timer_seconds.default=null; $.$defs.RecipeStep.required=["content","id","title"]; $.additionalProperties=false; $.required=["ingredients","steps","title"]` |
| recommend_claude_apps | app_ids | `$.properties.app_ids.items.enum=["desktop","ios","android","claude_code_terminal","claude_code_vscode","claude_code_jetbrains","claude_code_slack","excel","powerpoint","chrome"]; $.required=["app_ids"]` |
| search_mcp_registry | keywords | `$.required=["keywords"]` |
| str_replace | description, new_str, old_str, path | `$.properties.new_str.default=""; $.required=["description","old_str","path"]` |
| suggest_connectors | uuids | `$.required=["uuids"]` |
| view | description, path, view_range | `$.properties.view_range.anyOf[0].maxItems=2; $.properties.view_range.anyOf[0].minItems=2; $.properties.view_range.default=null; $.required=["description","path"]` |
| weather_fetch | latitude, location_name, longitude | `$.additionalProperties=false; $.required=["latitude","location_name","longitude"]` |
| web_fetch | allowed_domains, blocked_domains, html_extraction_method, is_zdr, text_content_token_limit, url, web_fetch_pdf_extract_text, web_fetch_rate_limit_dark_launch, web_fetch_rate_limit_key | `$.additionalProperties=false; $.required=["url"]` |
| web_search | query | `$.additionalProperties=false; $.required=["query"]` |

## Decision reasons

- **identity:** Use trusted current identity/product documentation, not archived provider claims.
- **runtime:** Use the actual host capability and permissions; retain the original operation purpose.
- **policy:** Retain the safety/IP objective while deferring boundaries to active platform policy.
- **format:** Retain concise, useful communication; user-requested format and code readability take priority.
- **current:** Retain verification intent; replace fixed dates, institutions, results and product claims with current evidence.
- **storage:** Retain persistence semantics; replace the provider storage API/limits with the actual application contract.
- **consent:** Retain choice/consent and fallback branches; use the current connector discovery and approval mechanism.
- **files:** Retain input/work/output separation and validation; replace fixed paths and rendering assumptions.
- **api:** Retain application API/state/error semantics; replace ambient credentials, fixed model and wire format.
- **schema:** Archived argument names/types/limits are reference contracts, not a callable Codex API; inspect the selected live schema.
- **preserve:** Behaviour preserved; only the agent name is neutralized where necessary.
- **attribution:** Keep source provenance without claiming the archive is an authenticated system prompt.

`preserve` retains the original behaviour (only the agent name changes where necessary); `adapt` keeps its purpose with the condition/wording adjustment given by the reason; `replace` substitutes an incompatible implementation/policy binding. No whole source section is silently omitted.

## Source-block decision ledger

`P` is `system-prompt/full-system-prompt.md`; `D` is `system-prompt/tool-definitions.md`. Ranges are one-based and inclusive. Each target is an explicit anchor in `.agents/skills/fable5-codex/references/source-faithful-port.md`. The target SHA-256 covers the actual adapted body, not its heading. Source file pins in the validator cover every source byte. Duplicate descriptions in D point to the same canonical tool adaptation rather than pretending there are two different runtime APIs.

| ID | Source span | Decision | Reason | Target anchor | Target SHA-256 |
| --- | --- | --- | --- | --- | --- |
| F5-preamble-01 | P:90-90 | replace | runtime | f5-preamble-01 | 74cba57ee9daa4903f929679bf4bcaa5b012141296c5f37866a8cd1e2e7baf40 |
| F5-1.1-01 | P:100-100 | replace | identity | f5-1-1-01 | ceb48bf7d00786c2cde0916d5af6c65afa513da96b0e130800d5abe0294fb288 |
| F5-1.1-02 | P:102-102 | replace | identity | f5-1-1-02 | 081fd2f609454de966065c3aa5c3f0f74120204e76273ac356e5e1569d70b93e |
| F5-1.1-03 | P:104-104 | replace | identity | f5-1-1-03 | 808455dbc506589fba44958c2d8e9f68b8124351e1028dc00a9d0bd8419393d2 |
| F5-1.1-04 | P:106-106 | replace | identity | f5-1-1-04 | 3541bc7df6497c3ad4d888eb5a922ee7c5b3e52bfaae2c9bbb2dcee95a4114b3 |
| F5-1.1-05 | P:108-108 | replace | identity | f5-1-1-05 | 41768d806ede96f691e41e747b083e4204a4d0fee84e2a013f5f8063b08c032a |
| F5-1.1-06 | P:110-110 | replace | identity | f5-1-1-06 | 140f4b0b45470e6e8ab30bbff6cc8930039a6dad09cf218479b24cce7f188915 |
| F5-1.1-07 | P:112-112 | replace | identity | f5-1-1-07 | 845e418a9450f13659c6a45e4c6ace894f5caeae265918b4355afa3b23270840 |
| F5-1.1-08 | P:114-114 | replace | identity | f5-1-1-08 | d273383d681402d243e3bd58ff403f1353e49d5a33bcba6331a7c700cafec273 |
| F5-1.1-09 | P:116-116 | replace | identity | f5-1-1-09 | 4171f4c22aac7a000fbe8d4e5e58fcd9ab56845627fc92696b23351b938de370 |
| F5-1.1-10 | P:118-118 | replace | identity | f5-1-1-10 | 6a98a289483aebf750df2940aaa75e3643c128b3bd1cb9a2f4f5780cac51fbbd |
| F5-1.1-11 | P:120-120 | replace | identity | f5-1-1-11 | a78375383b40eea88264c8b51ebfc4131bfd2d2a1f2b5afc91f751ae9bf0f440 |
| F5-1.2-01 | P:127-127 | preserve | preserve | f5-1-2-01 | fe4714e32ec058f66d43f6b8c482d1b31ce7d7e56c8d540370ce3127ac6330f9 |
| F5-1.2-02 | P:129-129 | adapt | policy | f5-1-2-02 | 7582372969a7bfd7078b74cfd66890fd203ff8f0987b274533637352f15d5c89 |
| F5-1.2-03 | P:131-131 | adapt | policy | f5-1-2-03 | 7824f8edb1b3965d53c5707c6267b81ffecbf9169352585a9f524f98c9611f29 |
| F5-1.2-04 | P:133-133 | adapt | policy | f5-1-2-04 | 10e08a36eaa79ab5da20929f770f68520c0844572f6508b54300a664ff76ee07 |
| F5-1.2-05 | P:135-135 | adapt | policy | f5-1-2-05 | 68bd5f95effaa365dd56d2007949d6581ca03ea5ffd75d3411b0431a1a199990 |
| F5-1.2-06 | P:137-137 | adapt | policy | f5-1-2-06 | 647fd3eb032fbf646dfd457ebdc3d7f097a17b73fb647185310cefa013010ee2 |
| F5-1.2-07 | P:139-139 | preserve | preserve | f5-1-2-07 | f591107ccc74b86e4f051cab9f2cbabd6a8697b390302fb407e97cb0eba8e197 |
| F5-1.2-08 | P:141-141 | preserve | preserve | f5-1-2-08 | 38690f0601adca882fd5c1a708467c34474426c66cbe5c0006526df61a104fa0 |
| F5-1.3-01 | P:148-148 | adapt | policy | f5-1-3-01 | 23a978135922b48011113b2d563ca5b1f73c98746ada2263b5c329d95b8e88ad |
| F5-1.4-01 | P:155-155 | preserve | preserve | f5-1-4-01 | 28b9f82fb136bbe0f4ce9dc80c27b002a64328c35795a045e5e72b9b96c04845 |
| F5-1.4-02 | P:157-157 | preserve | preserve | f5-1-4-02 | 305a7f042641b0294df0728ba42b1d54056313e0b6ec0dd2cb7941b6f38968b0 |
| F5-1.4-03 | P:159-159 | preserve | preserve | f5-1-4-03 | 3660afb864823492358f8ea87629c74598bf7b13e8a2fe38ab99a7431bdbf83a |
| F5-1.4-04 | P:161-161 | preserve | preserve | f5-1-4-04 | 5f8e5302a9a40cf37ad900b317aaa109ff8ff7235b6c672c5ec867931258b9b1 |
| F5-1.4-05 | P:163-163 | preserve | preserve | f5-1-4-05 | 377230cfa0b66442dba24931babdf4d834c833626187b2be9c91ecf6b2e83481 |
| F5-1.4-06 | P:165-165 | preserve | preserve | f5-1-4-06 | af40992aa285f63ae91a84d81bc81e0914f554bc81eb2d72ed51926084c6cac7 |
| F5-1.4.1-01 | P:170-170 | adapt | format | f5-1-4-1-01 | b910fddcd5efefd6202834180c69f0f3e30f6604f3fd403c14954c98d9ad47c7 |
| F5-1.4.1-02 | P:172-172 | preserve | preserve | f5-1-4-1-02 | 1964e983b276b58b5ea00e334648cae4ab4646d88f2ec2c692b7dd4f56f7f7a0 |
| F5-1.4.1-03 | P:174-174 | adapt | format | f5-1-4-1-03 | ae4b5aaaea06d6433cd2ff7b682e5bf04fdb4b281fc7e4facb9c62cf94b8a6eb |
| F5-1.4.1-04 | P:176-176 | preserve | preserve | f5-1-4-1-04 | f15fad8fdea1e68a6970153cee65a5ecb02457bae4daf7902959563b3eb5ebf8 |
| F5-1.5-01 | P:183-183 | preserve | preserve | f5-1-5-01 | 2eb115c88bdee898b7fc2491e9dcae0218a27112ac48d1ab3c30c455e1e246ad |
| F5-1.5-02 | P:185-185 | adapt | policy | f5-1-5-02 | 3da9b92fe2fbed9c2df6b0c99f2578f4ecb94921df6bd6fb8e4c16f25fe2e2b5 |
| F5-1.5-03 | P:187-187 | preserve | preserve | f5-1-5-03 | 3733a4515ae32936d06cb96ef039b3e4d4363c77086f634669f569e7361a718d |
| F5-1.5-04 | P:189-189 | adapt | policy | f5-1-5-04 | dd25fbeb441516fa169dcb4089ff09a62bc669eba2dd236ca22426a64a169602 |
| F5-1.5-05 | P:191-191 | adapt | policy | f5-1-5-05 | ec4fd09ee0069f24e68cde542a2a4b1c006fba4e437e791dc4e16f50411f1b9e |
| F5-1.5-06 | P:193-193 | preserve | preserve | f5-1-5-06 | 5924695dd00427017ffdc470175ccb10a6648d85b06a659c3a6774eb5cbbfa14 |
| F5-1.5-07 | P:195-195 | adapt | policy | f5-1-5-07 | 01115dea8e7c4939070dce67bf4d03b4390a5abf3f03fb329a5dbcb24ec4100d |
| F5-1.5-08 | P:197-197 | adapt | policy | f5-1-5-08 | 3cae8e0e62e7528feebfaa2e342803e47556f359f0d5422f62acb95fc37840fa |
| F5-1.5-09 | P:199-199 | preserve | preserve | f5-1-5-09 | de019e6631105136986d51224ab1e9df96b2dad1c54995eb3b4947d02afe970f |
| F5-1.5-10 | P:201-201 | adapt | policy | f5-1-5-10 | fca0d83b9eb6562b93ac2a86e56fe4391bca983b41504214937aacc30f1205a2 |
| F5-1.5-11 | P:203-203 | adapt | policy | f5-1-5-11 | 6380a2fbc3aea8b0ac067f0d756728457a31cbe97000c8c349d13aace361da2c |
| F5-1.5-12 | P:205-205 | replace | current | f5-1-5-12 | 864ffb3f366bb96efe038f357bf5b74b402176b872d4c2954852bb8b52d6ab61 |
| F5-1.5-13 | P:207-207 | adapt | policy | f5-1-5-13 | 752d8aed0f876f740a50dbaf472d89548d8e2c2dd1fe799a1ffa52b6dfbe4507 |
| F5-1.5-14 | P:209-209 | preserve | preserve | f5-1-5-14 | 63ced1302d45884b57b72a34f80193d43c709190859a0929eb7ac72d2d518dcf |
| F5-1.5-15 | P:211-211 | preserve | preserve | f5-1-5-15 | 17f5e843ca4cdf6de961f41cc1df41cb770c2171841125aab1f42e2e442074f5 |
| F5-1.5-16 | P:213-213 | preserve | preserve | f5-1-5-16 | 84878d18c0b86e2be73a8543e4a5a413d1a52063c03956ba6753b6e6f9c398aa |
| F5-1.6-01 | P:220-220 | replace | runtime | f5-1-6-01 | 0da53e7b1d58e983916e12fe449a1abebcaf2f8a7061027b73f7b2d6ceb5c0e8 |
| F5-1.6-02 | P:222-222 | replace | runtime | f5-1-6-02 | 6ba22a3c95c3e9f08e95974bc8dbcae451792a66d04ced624508f49a21193f2e |
| F5-1.6-03 | P:224-224 | replace | runtime | f5-1-6-03 | 2bd2b045d13a3d09902952b3eae886e942e142e263203389b3b75b74e7e90ab7 |
| F5-1.7-01 | P:231-231 | preserve | preserve | f5-1-7-01 | 29146e00f31dc9cc65508d6278b564c78255d952dacbf816e3d65f6d6967e289 |
| F5-1.7-02 | P:233-233 | adapt | policy | f5-1-7-02 | 3ccd4fe6d27d13a2bed4b3509edea97437f4a838ee1411775a1f4d8caed39d10 |
| F5-1.7-03 | P:235-235 | preserve | preserve | f5-1-7-03 | 9067881e51af26da723433687ee7a3bd44032fe8efbf6a96942c79e2176b5035 |
| F5-1.7-04 | P:237-237 | preserve | preserve | f5-1-7-04 | c1559c904c37b2c63ab24bcd867ca8f205995909391a13a14210fe840c3a879e |
| F5-1.7-05 | P:239-239 | preserve | preserve | f5-1-7-05 | 8faea80e8df91491bc2efa35bd3e2940e743a543eaef8e8960615ce2650b9c16 |
| F5-1.7-06 | P:241-241 | preserve | preserve | f5-1-7-06 | ea4a1c63f1a20e7c2fb5e60328bc9d9ef0b05d5adabf449b18b356d6ca15531f |
| F5-1.8-01 | P:248-248 | adapt | runtime | f5-1-8-01 | 222b85b6d1d78d854040c22ffd52f66b10cf1a0b4a07762e70e08919f9dfdfe0 |
| F5-1.8-02 | P:250-250 | preserve | preserve | f5-1-8-02 | fa4cf7e535a206d916508ce271cacd3296c59b290e6c9eeb32d8e989d33756fe |
| F5-1.8-03 | P:252-252 | replace | runtime | f5-1-8-03 | d63a591795449a22e9151666ec7e20cb108e2cd216ec1f491b8ca5edd4ad5648 |
| F5-1.9-01 | P:259-259 | replace | current | f5-1-9-01 | 4489c61b9a2f36095a8e29a50be85e7d65ba82f8fb01b1496d70809bc3a17f13 |
| F5-1.9-02 | P:261-261 | replace | current | f5-1-9-02 | e1921b89ee87f6b367d46dc87d9b25b253a9823e523c5e77400c00cd8fdebd03 |
| F5-1.9-03 | P:263-263 | preserve | preserve | f5-1-9-03 | 95abf2635f86ea429eec9044a5502de45a9f8744f78d188de55ce8cc6dfa77f0 |
| F5-1.9-04 | P:265-265 | preserve | preserve | f5-1-9-04 | 76ad53165d1693c3b95816407a4b6ff469cceece2ca87a7dfb481c55a18a2269 |
| F5-2-01 | P:272-272 | replace | runtime | f5-2-01 | 0cb23ee09107dfea0ac6760085b4b0cc9a1ca0c9d2785937a5af937f8e1204bd |
| F5-2-02 | P:273-273 | replace | runtime | f5-2-02 | 72bba820c5425f2b23ccddb78111596407568be43f352213d2ebc501e606dea5 |
| F5-3-01 | P:280-280 | replace | storage | f5-3-01 | e30269cb3b51534efdfdaf2726bfa09b730d3d779e6eb276a68899f5368e589e |
| F5-3.1-01 | P:285-285 | replace | storage | f5-3-1-01 | 54acd0547a93fbaf1ae9326dc5ce3c1e418f2c83374a4054ef17b157635570bb |
| F5-3.1-02 | P:287-287 | replace | storage | f5-3-1-02 | c54f175f1f75055a740b6528a33931ac4d6f48dd3509d84e24d7f5a36150de14 |
| F5-3.1-03 | P:288-288 | replace | storage | f5-3-1-03 | be51854a28a6affe6a6957f46a3ed0c61c783b0187dda2d1e51d74732e4cf84b |
| F5-3.1-04 | P:289-289 | replace | storage | f5-3-1-04 | f8af8069758d8aa634e0b9008f22277b518f3ecac01e4086598807a2da388ca5 |
| F5-3.1-05 | P:290-290 | replace | storage | f5-3-1-05 | 20cc74d331ea5ae79843bb09750b30c7ad34145334afe7d408b86da264e7f9b3 |
| F5-3.2-01 | P:295-308 | replace | storage | f5-3-2-01 | a43b76e4bf41ef5ab8e982a8523e4bc89fee14bfe672d80840673a8cba3e02fd |
| F5-3.3-01 | P:313-313 | adapt | storage | f5-3-3-01 | cc9c1c731b39046be09132822bb494aa88f052c94b16e1872b2ae10b7befa1f6 |
| F5-3.3-02 | P:314-314 | adapt | storage | f5-3-3-02 | 28b38cd6cef2a546bc8bbf0fd7b66a1d407fc81d32389f9ccc3f72055227bd83 |
| F5-3.3-03 | P:315-315 | adapt | storage | f5-3-3-03 | f8b85896c081a9b5efc3b5813fc0a60a913f4981008144349deef8f3365872b5 |
| F5-3.3-04 | P:316-316 | adapt | storage | f5-3-3-04 | 9ee0fa08a9af5b6d195c7c3c118add0f0b4dca073138e2290f0e9c2b3a225c75 |
| F5-3.3-05 | P:317-317 | adapt | storage | f5-3-3-05 | cdebb1ff12049f9d9077e114c3782b1fa9b392cff76ff34c3f2fbc325c80f20e |
| F5-3.4-01 | P:322-322 | adapt | storage | f5-3-4-01 | 54f5d3a8bf51ad42c9620c185792ea132b69d89c91855a8542203bcd2773dcb4 |
| F5-3.4-02 | P:323-323 | adapt | storage | f5-3-4-02 | 7122f2fb77fe3bd0a0fdde74ed6a82d9956ed8008e97a0c18a7dda757b17d84a |
| F5-3.4-03 | P:325-325 | preserve | preserve | f5-3-4-03 | 5029824c5ef5f49413c6ef75e51fbed958dcd4f32d5bc82feed0c79995baee62 |
| F5-3.5-01 | P:330-330 | replace | storage | f5-3-5-01 | df5c25835774c3fd986ef43a9dec368f5795fe5e305dadc69a36806f78856eaa |
| F5-3.5-02 | P:332-351 | replace | storage | f5-3-5-02 | 27ce8dfdd6668e50924af3d4c591811dbca92a80b1513591ac4cbcf9103fd021 |
| F5-3.6-01 | P:356-356 | adapt | storage | f5-3-6-01 | f73e412fcf64abce3355da1ccc0f375b4175cf514ed6a781788e1d1eda7e34de |
| F5-3.6-02 | P:357-357 | adapt | storage | f5-3-6-02 | 4916c6ec256f1a0424fa0d3ff8d318064b5909a0f9900588a7011e7b4cecb4e9 |
| F5-3.6-03 | P:358-358 | adapt | storage | f5-3-6-03 | b3dbf5dc16350b078a538144cb779a28f80f1d13c526f82ca813deb6ee319e04 |
| F5-3.6-04 | P:359-359 | adapt | storage | f5-3-6-04 | cff174913b6dfdcea4eddf5c5338c3b6d6cef4861e466f6848392d830750c672 |
| F5-3.6-05 | P:360-360 | adapt | storage | f5-3-6-05 | ade1fff991631992e8a9a23d97624e6ea43cd6e71ddae874914edef318470d0e |
| F5-3.6-06 | P:361-361 | adapt | storage | f5-3-6-06 | d23a5aaa536cd951cb22e43d3e9510a8c0447b09b8ceca62c594d97d3546a32f |
| F5-3.6-07 | P:363-363 | adapt | storage | f5-3-6-07 | 2f56a41bcaccd3e3dfdc3c8d713639b82c8f4197cb390b713b2d29aee0d6c0e4 |
| F5-4-01 | P:370-370 | replace | consent | f5-4-01 | 964bb1450bf8a1131813a0c44d519f27280ce8f935ec2530f99f017cf449c467 |
| F5-4-02 | P:372-372 | adapt | consent | f5-4-02 | 985095e415ad9b5af9f07782c7222f8cdf38eaf5ba8ff1721e166a10175a0b37 |
| F5-4.1-01 | P:377-377 | adapt | consent | f5-4-1-01 | 8407fe857635e6e759d7a25198d642123ec293c3db612a8999bb2ba5eac42246 |
| F5-4.1-02 | P:379-379 | adapt | consent | f5-4-1-02 | a9c0f09949eaaab77cbf5b50872866dec0dd14755aa2a764bcdfb5bb4dbf5696 |
| F5-4.2-01 | P:384-384 | adapt | consent | f5-4-2-01 | 9e8d07a432fca355e3f23000e419414633104b0c25059a07328a6ad7e1a31ce8 |
| F5-4.2-02 | P:385-385 | adapt | consent | f5-4-2-02 | 640c8a031f0deaaebf55666be0612ad5f3778d96b8c14b8b7eea1bc89e1f805c |
| F5-4.2-03 | P:386-386 | adapt | consent | f5-4-2-03 | 50c7466b8c75339837fa7f51bd5c9f847181be3a0b46ed6b8e46998d1e6dd639 |
| F5-4.3-01 | P:391-391 | adapt | consent | f5-4-3-01 | 4cc1c69ddecfb64bcfa78e920cc930a80eaeac62f1941f2ea1545760fb758525 |
| F5-4.3-02 | P:393-393 | adapt | consent | f5-4-3-02 | 1c2d090534c63f1967b75c80f7151003d367c8d9c1df841d3ef198fbf0dc3ac0 |
| F5-4.3-03 | P:395-395 | adapt | consent | f5-4-3-03 | 637e0200595f26a514479dd5a9929c4f103154e8ef10906637365fbfa61fa66a |
| F5-4.4-01 | P:400-400 | adapt | consent | f5-4-4-01 | fea1f32ffaeed016451ef47ac01a5eaf7d446f85c4a819cdb257921b8c181468 |
| F5-4.4-02 | P:402-402 | adapt | consent | f5-4-4-02 | 54218d85ab2aab6b550b9811671482cdeddae15bc2a3fc04324149bb5537f3ba |
| F5-4.4-03 | P:403-403 | adapt | consent | f5-4-4-03 | 1f265512788254d3ca1ee660e2a669d662192c37dbce2578a0b657499f176e67 |
| F5-4.4-04 | P:404-404 | adapt | consent | f5-4-4-04 | 87ba2264b5b95455fd34d83008b7707daa7633028ac68e709b713d7634783119 |
| F5-4.4-05 | P:406-406 | adapt | consent | f5-4-4-05 | 59ae55abce7e3a554757e22d1f6bd6df96bda178a6f97ca3c9b88e5daaa7f061 |
| F5-4.5-01 | P:411-411 | adapt | consent | f5-4-5-01 | 7ae61a2b4bd174b3db062cc05996f78efbb1429c349cdcd1a0cd1a3ff538381c |
| F5-4.5-02 | P:412-412 | adapt | consent | f5-4-5-02 | 94e8159a968ed57601152c08242b6f73f5135f7cb2d10ea9a25635620d95f51d |
| F5-4.5-03 | P:413-413 | preserve | preserve | f5-4-5-03 | 2cf73b8e859ed5b94529d242acab1bb8c171d19253a55dc887b544feac45787b |
| F5-4.5-04 | P:414-414 | preserve | preserve | f5-4-5-04 | 510898a8ffa4e1035893b8957c21fd86a585de708856f6c0c30c9c54c81a7f23 |
| F5-4.6-01 | P:419-419 | preserve | preserve | f5-4-6-01 | 2b90e9a0bb9e54b2fc54c8d24b1171078359de00b540d046e27f5300a0589b5b |
| F5-4.6-02 | P:421-421 | adapt | consent | f5-4-6-02 | e824ef3083754bdee536cd676ca1768338710bba0b0ceddb9e5368af7fab8714 |
| F5-5.1-01 | P:431-431 | adapt | runtime | f5-5-1-01 | cc501c413710343afa0ae67988be8bd201dd741ab5709b9c4fa94d23f810b2a7 |
| F5-5.1-02 | P:433-433 | adapt | runtime | f5-5-1-02 | 6fbbe224c8800f8ff4060654d0c986cf0a1651b0b1ca54851b01aba1040b48f8 |
| F5-5.1-03 | P:435-436 | adapt | runtime | f5-5-1-03 | c67bb86520b96376f8e30e6a345cdc98c7b358a4efae977fa798c43d0b58fc4c |
| F5-5.1-04 | P:438-439 | adapt | runtime | f5-5-1-04 | 53b619b13fb708e2e05c5ac143e6ab2109887494e33dca2ad277d4723e38f424 |
| F5-5.1-05 | P:441-442 | adapt | runtime | f5-5-1-05 | ef899b405bb512fb0b058e330860d9dcc78f2f25464d4318a8a35bc2744b22fb |
| F5-5.1-06 | P:444-445 | adapt | runtime | f5-5-1-06 | 60861133cda77f14cd8a8c2cf89a5214ac4054712951d80554d2adda592ef111 |
| F5-5.2-01 | P:450-450 | preserve | preserve | f5-5-2-01 | 2f2f05b1e6a4e7bdcae3c4fd962bf5a9827bdb345b48235bcaa1ca61d0066d43 |
| F5-5.2-02 | P:451-451 | adapt | files | f5-5-2-02 | 7a45ca8fbb5c4465762279f0700a7c16b60a1d69e39eabd909cb11527429063a |
| F5-5.2-03 | P:452-452 | preserve | preserve | f5-5-2-03 | 583a46534809d95a3779528b0ab67f8590da2c4a55a9365ebb2f8673d39521b3 |
| F5-5.2-04 | P:453-453 | preserve | preserve | f5-5-2-04 | 5198f0ecd58935b494998f67f660a50a851ae5e51a75f8fab535950c0d24bafe |
| F5-5.2-05 | P:454-454 | adapt | files | f5-5-2-05 | ef836fc4c6e590d63681caa72535d347f921e060942b969bdcc35095535d383b |
| F5-5.2-06 | P:455-455 | preserve | preserve | f5-5-2-06 | 6a18a06d44b4df5b638752498d634e054416f664c4952eace9165eaa3f3753c3 |
| F5-5.2-07 | P:456-456 | adapt | files | f5-5-2-07 | f057a6e8cfc5e1bdda374bfdf3cb2772dfbced62c2d2ccc54bcaa46006233bf7 |
| F5-5.2-08 | P:458-458 | adapt | files | f5-5-2-08 | 901662ef64e082b7910f596730268ced7cfe9afd513d7d08b8d97f8deba40cc8 |
| F5-5.2-09 | P:460-460 | adapt | files | f5-5-2-09 | 059ce5a0764d056f7df915012c066b967417bd41fdb43c7c8d0a417e77b4eeb3 |
| F5-5.3-01 | P:465-468 | replace | runtime | f5-5-3-01 | ace0e07bcf0e8cad035440d84690470e58b50a91dc70ae16cfe6c2a6c75f393f |
| F5-5.4-01 | P:473-473 | replace | files | f5-5-4-01 | 7794a9421d4df40d42b899060f02ab7094b6eccb764253684b438d29f4cbcf55 |
| F5-5.4-02 | P:475-475 | replace | files | f5-5-4-02 | cd6e4c15f85aab2bbed1d4706e60a9f3694d090408dfadf3b8db41971bb56155 |
| F5-5.4-03 | P:476-476 | replace | files | f5-5-4-03 | 3958c7228d6a8eb381c8fc8ff4a03417e6f2aeb5f3ab34243212ee2b23ddb7cf |
| F5-5.4-04 | P:477-477 | replace | files | f5-5-4-04 | b7dd9c05158d2bfa974f615dc8bc2ce433c5c219cd3b804164c4949f82e18738 |
| F5-5.4-05 | P:479-479 | replace | files | f5-5-4-05 | 18ce5af7d0a742bc863c42e80e4837ffc85ed0b8a2aa57b3e549a7f59e6a5841 |
| F5-5.4-06 | P:480-480 | replace | files | f5-5-4-06 | 26e6cc1afce31c9fa95e7330111f075e60d780ba50f1e3c4c653b83bd2831127 |
| F5-5.4-07 | P:481-481 | replace | files | f5-5-4-07 | 4147c0a40d580fd0b90495d4c2d725d3a595c35f3ffab16981cd47c106ee980e |
| F5-5.5-01 | P:486-486 | adapt | files | f5-5-5-01 | 611d5d2045d761b844c31dd49882a8e2320536ba0618a6fb5702bdab1f62d440 |
| F5-5.5-02 | P:488-488 | adapt | files | f5-5-5-02 | a91673225ddaef695e940e824bce381ea8b37612ee40002d25bee34158a8dcc7 |
| F5-5.5-03 | P:490-490 | adapt | files | f5-5-5-03 | 2d64bac0b889f2a69e6cd8d67104989be6ef144483991ec068d6f5f7fdedb902 |
| F5-5.5-04 | P:492-492 | adapt | files | f5-5-5-04 | 0aac6834b75fd066253409cf5b7e6fa9b57bf4d143d9779596260d4f00a3ad22 |
| F5-5.6-01 | P:497-497 | replace | files | f5-5-6-01 | 36464b4acc81ef4545578887033e6cd65b69159d5b12316c95b571c078e98920 |
| F5-5.6-02 | P:499-502 | replace | files | f5-5-6-02 | 4ce83185eb8be70ca9b6d728dd39cab1e738a951ea5d12d4c2f115d84bff5e5f |
| F5-5.6-03 | P:504-504 | replace | files | f5-5-6-03 | 167d5e7a418ded8d62a49d9009f8fa46c3de153e532cc34735100d4929a33d87 |
| F5-5.7-01 | P:509-509 | replace | files | f5-5-7-01 | 70577bb2d3bec1bf41691e33d2c7f082cc65b07296c5f0255fe520dcc67afe28 |
| F5-5.7-02 | P:511-511 | preserve | preserve | f5-5-7-02 | 9e59a1a4b257b4f8157c1cf58057bd172011919c5759d4d5d6aa426f474733de |
| F5-5.7-03 | P:512-512 | preserve | preserve | f5-5-7-03 | 3d865384dd952ca29e1800575e72b408cee85c38c642a145454c77f8a22a8e24 |
| F5-5.7-04 | P:513-513 | adapt | files | f5-5-7-04 | 05d89f2ddd6b7d3155e5e85c9575f16fb9555db89bd23419248f8bbb9c1fd04d |
| F5-5.7-05 | P:514-514 | preserve | preserve | f5-5-7-05 | d08d660f6bdeeee6306f8cb26387840f86975b18b01427033a80bb8ae8c2afa9 |
| F5-5.7-06 | P:515-515 | preserve | preserve | f5-5-7-06 | 898604244dcef2978c4c17fd8d59238d3fb84fc1a14d2e70d2c659cd6bceaf66 |
| F5-5.7-07 | P:516-516 | preserve | preserve | f5-5-7-07 | 77e28fd55b9b02175d9d28c6dbf293a430c321b5b045069a212d58fec11e98a8 |
| F5-5.7-08 | P:517-517 | preserve | preserve | f5-5-7-08 | 5b54831fff99f6ebb0fec44cbb1a722e90f0d4f982ea14692ab201a2a4be476b |
| F5-5.7-09 | P:518-518 | adapt | files | f5-5-7-09 | 2de047dc907cbfa0ff8524079227ca274a9dfc1b1178b4646631a38893e0548a |
| F5-5.7-10 | P:520-520 | adapt | files | f5-5-7-10 | f0dc7ec9db019a8a7f198818a5560a1133de0e281ff52cd35886069a3f884fc3 |
| F5-5.7-11 | P:521-521 | adapt | files | f5-5-7-11 | d1ed834fd9213582fed1e7859bb9755582f0bad8e062b2e367c4c1c0b4a0794f |
| F5-5.7-12 | P:522-522 | adapt | files | f5-5-7-12 | 4f6a6d41c7a80440980024edd683e7993934741833e166cc92c3e0fc2c469355 |
| F5-5.7-13 | P:523-523 | adapt | files | f5-5-7-13 | 21203d4ff7cd9c74ce6288f1507b30fc8869b4bc3b9cacc07d2608fab348c6e4 |
| F5-5.7-14 | P:524-524 | preserve | preserve | f5-5-7-14 | cafb3dbaa26e1b0a9b4b2682476507b7cee43d0a58997025490f6d80adbda6dc |
| F5-5.7-15 | P:525-525 | preserve | preserve | f5-5-7-15 | e42262f4e33c0533c11b9b4ad67745660b212d68d6784d2f7e2b7b576c2fb6b7 |
| F5-5.7-16 | P:526-526 | preserve | preserve | f5-5-7-16 | 42cc59219efcb4e00d5ca20361b450a8371bed093c0b93bf3f3dde22f771f5ab |
| F5-5.7-17 | P:528-528 | adapt | files | f5-5-7-17 | 4e3761d17dc1c9775c571e1e621692b9e0ae256c830ab5ea47ac7669aeb703bb |
| F5-5.7-18 | P:530-530 | replace | files | f5-5-7-18 | 183eed4e5872d83abddd0eee3b64b9dcd48a767d47e257d6f19ac7112c380163 |
| F5-5.7-19 | P:532-532 | adapt | files | f5-5-7-19 | ccece10aad5492bf2851912c47c4f789932f13c6fce776928d7f7250d666c9c8 |
| F5-5.7-20 | P:534-534 | replace | runtime | f5-5-7-20 | 691d50543ebeeb9ce7db22eb19da38cd3fe3d718f4952a0c38b05f632861c04a |
| F5-5.7-21 | P:536-538 | replace | runtime | f5-5-7-21 | 0e0c55cd9e6a37cb9abe3d8619e29a0d5f8b6ab56dd191364d3461977caa1ff6 |
| F5-5.7-22 | P:539-539 | replace | runtime | f5-5-7-22 | 669c84fdeac17d1201e5b792e2feb361511355d254b758514c36642803c1d5a3 |
| F5-5.7-23 | P:540-540 | replace | runtime | f5-5-7-23 | fda34fc091f7373aba7ca8cda86dd4629e07b3c29681c54861763ed3777bcade |
| F5-5.7-24 | P:541-541 | replace | runtime | f5-5-7-24 | 15d66a646fd8e6bbfe72f24b3696e9944b4ad23b7d9e6a2b5e2246d0ddc2d831 |
| F5-5.7-25 | P:542-542 | replace | runtime | f5-5-7-25 | bb81dbff63f0c401b4eaf82061d931f70058ab5743b0d92d1e4d9db43c45a8c2 |
| F5-5.7-26 | P:543-543 | replace | runtime | f5-5-7-26 | 130921bafb433a4d5e8b9cbc3e4f88044ce69bb7dbecf0786f206587cdfb496d |
| F5-5.7-27 | P:544-544 | replace | runtime | f5-5-7-27 | f278d4bf3845ec310b880422ebdb5373b05b29ab6d116b72d5f24cf34d269bef |
| F5-5.7-28 | P:545-545 | replace | runtime | f5-5-7-28 | c6d7e3ef0bf3d8f72c7fce948dd533c399b3706ac3c6168073a1cfc1248457f4 |
| F5-5.7-29 | P:546-546 | replace | runtime | f5-5-7-29 | b978d07df49871982b9f7297d46e09a471cb6dc7f053332d69dcf261c634181a |
| F5-5.7-30 | P:548-548 | replace | storage | f5-5-7-30 | 794f1bc45487401f6c6f1afb745d55f57540e4c338059e927b04a12cfd2721e4 |
| F5-5.7-31 | P:550-550 | replace | runtime | f5-5-7-31 | 7be25191cb8273b965bc36e37a18f1b61ebbf698dddcdfdecf4297fdd00b3b97 |
| F5-5.8-01 | P:555-555 | replace | runtime | f5-5-8-01 | 92ca98e3cdc9ac45e4280e0d4676644ebaf6e4ee8b70c59719bfd9cc43595941 |
| F5-5.8-02 | P:556-556 | replace | runtime | f5-5-8-02 | aa0ebec72d6e1f25a2cf54dbbdbaaf8518b3a5fd6457d714c15eaf4334fc2246 |
| F5-5.8-03 | P:557-557 | preserve | preserve | f5-5-8-03 | 2845565368da141036ef64e0fc6f32e8af5a548ff03f00f061f013a7f6e483ea |
| F5-5.8-04 | P:558-558 | preserve | preserve | f5-5-8-04 | 2a36913daf4384b2362ded6f5a4be50dc91fda054223ecd19f148ef69426e9e4 |
| F5-5.9-01 | P:563-568 | adapt | files | f5-5-9-01 | 166bdb131b77b2ff9841ddb911bfbd6e850d6368db9f87d17a9d8412e4f9d46d |
| F5-5.10-01 | P:573-573 | replace | runtime | f5-5-10-01 | be415ba9f35e375de8541ed04e459fac491df207f333f98fe7e5fbfde23c80e2 |
| F5-6-01 | P:580-580 | replace | policy | f5-6-01 | 752a5c400c141c94ce8d140638aebf1284c0892d2c5036491d6289c00f1fc9e8 |
| F5-6-02 | P:582-582 | replace | policy | f5-6-02 | f02318b86e0fe1fa123d4dc742444f34a01f78045c1181486be1e62ace86d4dd |
| F5-6-03 | P:583-583 | replace | policy | f5-6-03 | de7197f3b91ce49528b75efa8a145a3e5869a2f709482bc081593b7d790dc9c3 |
| F5-6-04 | P:584-584 | replace | policy | f5-6-04 | f8002c9c8f3e2984ff5436f24e1249a1dc4bd2129a14c788ae3c67d59a83e1f9 |
| F5-6-05 | P:585-586 | replace | policy | f5-6-05 | b5763d9dbef6076ac77af77370835e84c61be49a59ba2c9240e88946b21cc5b8 |
| F5-6-06 | P:587-587 | replace | policy | f5-6-06 | d1d2ef67a85b9ef5f17791d9592d0c9a4d375b09c065c42657510a0d470ed8e1 |
| F5-6.1-01 | P:592-592 | preserve | preserve | f5-6-1-01 | 9d70a054e74e34ba403314a9bc53578ddefa02a61cc0b28059a8d5f432de65fb |
| F5-6.1-02 | P:594-595 | adapt | current | f5-6-1-02 | d8e006d42913f890e1a850d12cab811c2b30d122661d16927bbebcb3b3ebbaaf |
| F5-6.1-03 | P:596-596 | adapt | current | f5-6-1-03 | 3ce5a5410aea129f6a0b54ff3b39ce515526096f897ebdf50a7231bccbcb8c42 |
| F5-6.1-04 | P:597-597 | adapt | current | f5-6-1-04 | c7b51bf659b7da6effe4cfea862f72575d09430db01208efdc1d911889fab277 |
| F5-6.1-05 | P:598-598 | adapt | current | f5-6-1-05 | 9ba535a9e5a41453ac9f6af7def91de7788d28210a5c5e1c017bef412d376505 |
| F5-6.1-06 | P:599-599 | adapt | current | f5-6-1-06 | 235d8b2aa7e059c3170f114b51c231178dcc2cd959094144931e473bb67fcac7 |
| F5-6.1-07 | P:600-600 | adapt | current | f5-6-1-07 | 0805cf72a47d38b2f0266ca365e02d3e9e9d533a8ad597a27f3b848ba0fa78ab |
| F5-6.1-08 | P:601-601 | adapt | current | f5-6-1-08 | ff7555fe9a876db4d48139d8e47c4d24abfee75106ea5dfe7efe348e4225fc69 |
| F5-6.1-09 | P:602-602 | adapt | current | f5-6-1-09 | 904aef1b611e2a7d36f5513101549a95d1cacaf87a2a80637aef918a05a4dbbc |
| F5-6.1-10 | P:603-603 | adapt | current | f5-6-1-10 | ed17983c84384d992f2e106311d6c1bb77b04c553018ee187bda2cccc9b51daa |
| F5-6.1-11 | P:604-604 | adapt | current | f5-6-1-11 | 371b7a42bac854377a66864e8c0459a5b3677ba00dcd88b8bd271629550522b1 |
| F5-6.1-12 | P:606-606 | replace | runtime | f5-6-1-12 | bcd7d4b2573b7f96b3b2c5b61e25654c0739a029284cf53655d49e24cd08a783 |
| F5-6.1-13 | P:608-608 | adapt | runtime | f5-6-1-13 | 9bab344acf16e7816ffc9ef674ba030e93fffaad17afe8fd644c52ea921c0602 |
| F5-6.1-14 | P:610-610 | adapt | runtime | f5-6-1-14 | c40d86eab24e6b5b2148c430d49787983c8bcc953a7d0d075c9412f3609ef0b8 |
| F5-6.2-01 | P:615-615 | preserve | preserve | f5-6-2-01 | 0db2786d38ba46dd0bc446de8033e2c40b0c04214958a1cc1a807732d655d894 |
| F5-6.2-02 | P:616-616 | adapt | current | f5-6-2-02 | 03b5c4df6b861f337f356863b106c4464f0ec8c1b2e9c245df862ae360ca5f33 |
| F5-6.2-03 | P:617-617 | preserve | preserve | f5-6-2-03 | 6a39e17ef10956adb5618c8bb46e1cc5409e0f18841dbeb92f8d39b8598ae064 |
| F5-6.2-04 | P:618-618 | preserve | preserve | f5-6-2-04 | 322c2f6c91240b9feabd5cce7cc82a4dd514fc469dbfc22496e1541b10d9c3fb |
| F5-6.2-05 | P:619-619 | preserve | preserve | f5-6-2-05 | 54fd819923858acea2688c1fc48f622ea4d22e42d6d67ed5a0890ddeedbc404a |
| F5-6.2-06 | P:620-620 | replace | runtime | f5-6-2-06 | db61c3245dc294beb163a4862ba561cdc4c6d10f60f5b22c541f250966b180cd |
| F5-6.2-07 | P:621-621 | replace | current | f5-6-2-07 | 98dc15b4d01aa5b1b3d09364d74760bcb5d6ffeaf24f4f72a45768bffd86326a |
| F5-6.2-08 | P:622-622 | adapt | runtime | f5-6-2-08 | 1fc800feb996f8a0628fde2f9743c1acd9cc153724d008e6681438229a523543 |
| F5-6.2-09 | P:623-623 | preserve | preserve | f5-6-2-09 | 863dcbde4937effe5104c028c97ff658587df748bdc02c766043ae1f13fcdeb9 |
| F5-6.2-10 | P:624-624 | adapt | policy | f5-6-2-10 | 71f2adb243635c74730bfc053ea9c2f1693e842e013e76872db2fbb9d0d298f0 |
| F5-6.2-11 | P:626-626 | preserve | preserve | f5-6-2-11 | aa42ff35636b50750ebcba09bb2f52feb43df6dbea9ed4ee378aa08f5d900e4c |
| F5-6.2-12 | P:627-627 | replace | policy | f5-6-2-12 | 1f7b7526028f784aba509b09551a7a050bd37b3f203e27df253f1a9f678b5d36 |
| F5-6.2-13 | P:628-628 | preserve | preserve | f5-6-2-13 | d67e1bf4bda746b4f85b75a57867d3cb53383fbc6e0f35aad055d7916e0616da |
| F5-6.2-14 | P:629-629 | preserve | preserve | f5-6-2-14 | 51ea5f810bb07fdbec435c0cee65cc30a8e9903e522817134f254b6f386dbf9c |
| F5-6.2-15 | P:630-630 | adapt | current | f5-6-2-15 | 7f93500b4efa684079bb3c4cc708a349a474c9f24f58bf283d78f344d9c428f5 |
| F5-6.2-16 | P:631-631 | preserve | preserve | f5-6-2-16 | 62658d0ccdd4a95eace12b0dfa011cb8dc6326d3bb1eebc07b181ae65563b76a |
| F5-6.2-17 | P:632-632 | preserve | preserve | f5-6-2-17 | e131f8d23b632001419ef5f107e652e5ae4e7ae03789d158a637135461bcefbf |
| F5-6.2-18 | P:633-633 | adapt | policy | f5-6-2-18 | 86b0ce46162fb1afce36a84cf87d6cfcf2d7cd1d51fdf3e28497b527a1cf3e96 |
| F5-6.2-19 | P:634-634 | preserve | preserve | f5-6-2-19 | 0d97f242fa826d0c3f2e3c59b2a62ec5e1b3eeb3643c60e11733e5c5cc78484c |
| F5-6.2-20 | P:635-635 | replace | runtime | f5-6-2-20 | 16a1fdedb981c79f75f98149fbf3dc2a8d0f9511f9350376d638d33287fb0f25 |
| F5-6.3-01 | P:640-640 | adapt | policy | f5-6-3-01 | 526a0965efdb4b717b6c2d21af3f87c63970b62418e43577dd53a0a12ff4115e |
| F5-6.3-02 | P:642-642 | adapt | policy | f5-6-3-02 | f9715092c614fa6ad1ceca92d18b21a0991af3b31b1cc80389c9003685cfbcb6 |
| F5-6.3-03 | P:644-644 | adapt | policy | f5-6-3-03 | 32353000ebfa0b5d72e44c4efa2d1e1e743ce5b6cfc0d54bd7a61b69dcd9c08a |
| F5-6.3-04 | P:645-645 | adapt | policy | f5-6-3-04 | 632297947a3a036f88d9e1e8b857c74ad754d8f0e07f18613c878e59e61f8413 |
| F5-6.3-05 | P:646-646 | adapt | policy | f5-6-3-05 | 0e172d9dd7547488d70958c70dcd41d5e6feb4212ea94d51cdeaa11f1501e4a4 |
| F5-6.3-06 | P:647-647 | adapt | policy | f5-6-3-06 | a9a45367e53faa98cc5f17f7e4fc00eac9203b618fe4c0f930e125575a5bd786 |
| F5-6.3-07 | P:648-648 | adapt | policy | f5-6-3-07 | 15140fd69eb8ababdff3de7226359aa3c9e054126f377c42350a574cd5f45d59 |
| F5-6.3-08 | P:649-649 | adapt | policy | f5-6-3-08 | d5c6be8dae12249a2b75087caf8050b98e52bf63f571a8b7e48752bda3387a7f |
| F5-6.3-09 | P:650-650 | adapt | policy | f5-6-3-09 | 31d5427583df998ac3ee2d1260dd76d9febd56c529b38f0be70fde84bfe17902 |
| F5-6.3-10 | P:651-651 | adapt | policy | f5-6-3-10 | b9fb5aedc082454d249b3b9112f131c5507a6219031bac4172b842916b848474 |
| F5-6.3-11 | P:652-652 | adapt | policy | f5-6-3-11 | 91039dc099a9660e13eef6b5c882b639bb30eb9c8b103beb41e36cd3696c74e8 |
| F5-6.3-12 | P:653-653 | adapt | policy | f5-6-3-12 | c42b1ff0983b2a361153e768830f3e772a42f9e2f64fdda3d130347035eac8f4 |
| F5-6.3-13 | P:654-654 | adapt | policy | f5-6-3-13 | 08a0698774350c6536c2a80292ecbed0e2952718f152c94e5e6af17913378a20 |
| F5-6.3-14 | P:656-656 | adapt | policy | f5-6-3-14 | ade079023730c1211b3a5e544f4f034d8e73245a88978c2f26203d6c669fe577 |
| F5-6.3-15 | P:658-659 | adapt | policy | f5-6-3-15 | ac845bfd8ca352ecc2c06016e93a2e925a44d0f028250273428f4179a6046167 |
| F5-6.3-16 | P:660-661 | adapt | policy | f5-6-3-16 | b4871ffbde3d9a49de4f4ef92bf6ab3b462a948fd7de582d04c34fdaca2f5b06 |
| F5-6.3-17 | P:662-662 | adapt | policy | f5-6-3-17 | 20d5e545453989b0dba5166226c94d3afed3a2e329c9c82b3cc35ab7f12d686c |
| F5-6.3-18 | P:664-664 | adapt | policy | f5-6-3-18 | cf16df204efc9557cf5e234848f20482b0cd5d390f5a29570e545ef2abf3cff3 |
| F5-6.3-19 | P:665-665 | adapt | policy | f5-6-3-19 | 5e2dbb2605122daa454ad87728bea0f010f69cb5e142760419ff89e90a0c27eb |
| F5-6.3-20 | P:666-666 | adapt | policy | f5-6-3-20 | 4251f528f271d558b537a417ff37fa92b75a8d123d1de0e72b4bf41e86b57f63 |
| F5-6.3-21 | P:667-667 | adapt | policy | f5-6-3-21 | 13e65ad843ef17556c19a2ac10741ed8f32e52e1fcd810690704c62e18a7591e |
| F5-6.3-22 | P:668-668 | adapt | policy | f5-6-3-22 | cef6539cff39940e54d7ce51110cda138f8df6b9ea04eb78f70e6cc1a2f02dfd |
| F5-6.3-23 | P:669-669 | adapt | policy | f5-6-3-23 | 2d6c3fc93c79fdc65328c6135e8c95cbd8100c1509e71fe4f7c8d0b109f1b487 |
| F5-6.3-24 | P:670-670 | adapt | policy | f5-6-3-24 | 34df91d97ae5bb9ff1da697b9c39afe3a699bdb97b36e296070e5a778b3c25a8 |
| F5-6.3-25 | P:672-672 | adapt | policy | f5-6-3-25 | ba002d5e7b17e16e4594f2cfc3f2e5723021c6099c6b2b149955bba130582b18 |
| F5-6.3-26 | P:674-676 | adapt | policy | f5-6-3-26 | bee821d9fb704bb8af51fb49f88ca8208ad19f9ffc3151b278998a539d8dace6 |
| F5-6.3-27 | P:678-680 | adapt | policy | f5-6-3-27 | 1bc95c0dd05e5a580957ef7ea68a2ec7afc4b5e887c2dc0b4b1362aa4eb15084 |
| F5-6.3-28 | P:682-682 | adapt | policy | f5-6-3-28 | d03c30d7200a25b58d7065d09204b32a2a7638ab2a73ac402fb954bccd509a34 |
| F5-6.4-01 | P:687-688 | replace | current | f5-6-4-01 | 67cbcc8f098cc276005ce9c3ff2917146e2d9bedc2fd18dda7358be825baf248 |
| F5-6.4-02 | P:690-691 | replace | current | f5-6-4-02 | 86255f8a8d4b32ceb203cb0d32a497215e1e6c1b20c2b3974c28d3843f1b33c2 |
| F5-6.4-03 | P:693-695 | replace | current | f5-6-4-03 | 0dc8854e4ae393f257b6f4f4e5c0034b0b149e3e2c6ded73f5519b268b51c51a |
| F5-6.4-04 | P:697-699 | replace | current | f5-6-4-04 | 4bd43c8396bf55c80e6ab9bda2ed5942457068f9c1598532daee79e59b34cf0b |
| F5-6.4-05 | P:701-703 | replace | current | f5-6-4-05 | f8990d712f732307741f03eda616b1fb1e08b7d2869ed45b74249a77b19a4181 |
| F5-6.5-01 | P:708-708 | adapt | policy | f5-6-5-01 | 90f2ff356faa9b7d89789ee9705a09e56fd3135bbb39153ddaf22f345af6cb11 |
| F5-6.5-02 | P:709-709 | adapt | policy | f5-6-5-02 | e3d7cfa5a7f26a516e554da658dd705a9a16de189426522809ed6d2800cd964c |
| F5-6.5-03 | P:710-710 | adapt | policy | f5-6-5-03 | 5563665ecfd6a7852edf2366e0d4dc425a38bd77347d2a469321a3d72506a0d5 |
| F5-6.5-04 | P:711-711 | adapt | policy | f5-6-5-04 | f6fcb088761160e57d0ffe3e0b60b7b235b68747fbe113e7c6f43b3a3db3310f |
| F5-6.5-05 | P:712-712 | adapt | policy | f5-6-5-05 | 7e4a51ae02793675d7c347fdcfb3f68ae31b2643c74136c553f066a9cc1e87df |
| F5-6.5-06 | P:713-713 | adapt | policy | f5-6-5-06 | 3079e659a4d6ca636b369520b01fa3df27ac07385936684c1347b92bf5e2c0f3 |
| F5-6.5-07 | P:715-715 | adapt | policy | f5-6-5-07 | ee10c224efdfabf499d89074c0455e375c1b1ea434a2d29547b873044340b681 |
| F5-6.6-01 | P:720-720 | replace | policy | f5-6-6-01 | 2029f321196d11953166b11473eb3ec6f5d906bff47500105f2322dc1b9397a8 |
| F5-6.6-02 | P:721-721 | adapt | policy | f5-6-6-02 | 99efbead5d557e054610dd42882608fc014b2ce0d7253550332f39888609bdc2 |
| F5-6.6-03 | P:722-722 | adapt | policy | f5-6-6-03 | 6ee7e74c2c6ce6fb7b31c71ccaae6a961a1262d29e2be98e1fb93678238e5b58 |
| F5-6.6-04 | P:723-723 | adapt | runtime | f5-6-6-04 | adb9023ae34c8f9768cd30d31a4713b2cefb52047070d9515c2e7439d7e235f1 |
| F5-6.6-05 | P:724-724 | preserve | preserve | f5-6-6-05 | 394c529c9069729aae4cd9f86f0a29fd4b6f3aa159a2d5ac4db6411647314878 |
| F5-6.6-06 | P:725-725 | adapt | current | f5-6-6-06 | 46f4f2fec7e2ef134b58aecd72b46b06df1c47eb5aa0b8a9332802c4a6e1953b |
| F5-6.6-07 | P:726-726 | adapt | runtime | f5-6-6-07 | 03d589258d527bc39f8d8a5455fc6f5b67262a8bb091bd72f5412cbf864d0345 |
| F5-6.6-08 | P:727-727 | adapt | current | f5-6-6-08 | 8ba876028589527751aba94dee1b267e1323681c3f7e81ecc8dc2cc775fa09ed |
| F5-6.6-09 | P:728-728 | adapt | current | f5-6-6-09 | a4ed93b0ebed6f3102a72f8840b65e80f99685f65db90cebdf29e5bf0c056ab4 |
| F5-6.6-10 | P:729-729 | adapt | current | f5-6-6-10 | 5deaf2b6ca35d1157870df034554a547104a0d1b992542dfa7fb82d0844a29ea |
| F5-6.6-11 | P:730-730 | preserve | preserve | f5-6-6-11 | d91c5b1af7f3a09baa1b16b841d3cc09b92b6bc1bfd64baa4f990dbb599c9257 |
| F5-6.6-12 | P:731-731 | preserve | preserve | f5-6-6-12 | 82ebe7e3836d36569ed05a2b356bd6d4bb1a1335f2f6332451fa432a60c39150 |
| F5-6.6-13 | P:732-732 | preserve | preserve | f5-6-6-13 | 628d6d56b47fcc6e5997e2f5d8bbf7a8bb6c60deb71c115a94f37c07d109fcc9 |
| F5-7-01 | P:739-739 | adapt | runtime | f5-7-01 | f004283c84496d0147e42230cd67b00a12162ee61a3836dbc003a619776d1f92 |
| F5-7-02 | P:741-741 | adapt | runtime | f5-7-02 | abb32d940eae9e484dd7544785fe6db0c02c0b45285f92fd101eb58f1c95c939 |
| F5-7-03 | P:743-743 | adapt | runtime | f5-7-03 | a8e9c13acb0c050d20328f18aa3425597658f038a947fa4e846836c3ed1d5037 |
| F5-7-04 | P:745-745 | adapt | runtime | f5-7-04 | 9281b08c46fcb3e64d83b1a929ae70d0c34f72741afc142c93ab503d1fce12ec |
| F5-7-05 | P:747-747 | adapt | runtime | f5-7-05 | ae415ebab9a6f5f75f2c59ee14849d3da1ab87db3478f4b0e105a903307c9c8a |
| F5-7-06 | P:748-748 | adapt | runtime | f5-7-06 | 457fb39bb91a38bb426ff4f69cbcca72ea5c926a54149cac29c2436e01b3cc05 |
| F5-7-07 | P:749-749 | adapt | runtime | f5-7-07 | 02b4acea7986fdb9a1b64f16aed18b0fae20e76ddaadc7ef16410821e7e21e22 |
| F5-7-08 | P:750-750 | adapt | runtime | f5-7-08 | c6eec0b2ba195e6cfebbbe399d296ca3cf19fa78515e028c9873bd5fb2789264 |
| F5-7-09 | P:751-751 | adapt | runtime | f5-7-09 | f8dc1c38a28c0801b5da271a068cdd52a3718f5e4445e1e0fa24dd3779f4e196 |
| F5-7-10 | P:752-752 | adapt | runtime | f5-7-10 | 0917b0577b4d29ee166e7c79160b4a4cf08aecb6c0051be4a1cf0805c399b2c2 |
| F5-7-11 | P:753-753 | adapt | runtime | f5-7-11 | 02b8eb945323aa56863b75c32fb78e7e1f374f1f6f369f7d779e2c0fd07f00b9 |
| F5-7-12 | P:754-754 | adapt | runtime | f5-7-12 | dfcdacf3e3173f75dcd31d12e3ab7dc341afae4f8451809cb2640d9156d16823 |
| F5-7-13 | P:755-755 | adapt | runtime | f5-7-13 | a896aaa4e013808e9e4307cb0db206d6ef6931332e6be96b3d84e7ad303c1e78 |
| F5-7-14 | P:756-756 | adapt | runtime | f5-7-14 | 5d4986c7f5a5c521a30ffa182251eb78e42525f15d19ac45e0cf8e333c715e1c |
| F5-7-15 | P:757-757 | adapt | runtime | f5-7-15 | 889f72c0528a80a4af0386d5dd42bfa7775150709aa8060ab40b58d43697d31b |
| F5-7-16 | P:759-759 | adapt | runtime | f5-7-16 | 5332e8429ffb0b381f36827659db89074506388c49a052617cefb42037959fa2 |
| F5-7-17 | P:760-760 | adapt | runtime | f5-7-17 | e509fbd99ab07e5ce6ef6b488a3ca343ea866f3c522c031ddaf3dc8d22f9e390 |
| F5-7-18 | P:761-761 | adapt | runtime | f5-7-18 | cde24001a2a38c48e6fe8c1e7ea4c8c832257f6bfd52882db50c28c6b01cb5bd |
| F5-7-19 | P:762-765 | adapt | runtime | f5-7-19 | 4d610c943efcfbd0d7dc30a41d1f1e47ec99f590a10d5f0ed46b4635d4a072d0 |
| F5-7-20 | P:766-766 | adapt | runtime | f5-7-20 | 506a63651d66694ff41582d20287e2d00cd8daf62ed2b40ac1f63000fb649a26 |
| F5-7-21 | P:768-768 | adapt | runtime | f5-7-21 | ba002d5e7b17e16e4594f2cfc3f2e5723021c6099c6b2b149955bba130582b18 |
| F5-7-22 | P:770-771 | adapt | runtime | f5-7-22 | a0c8d1d660044674409a6288dbab5bf73fa1a9d4eca50f58bcecce68ccf438d9 |
| F5-7-23 | P:773-774 | adapt | runtime | f5-7-23 | 0a44fda03431ed80f8acfa97bb7ca21ef56612dc44980e07a8168e6df4133e1a |
| F5-7-24 | P:776-777 | adapt | runtime | f5-7-24 | e422ead248da4dc6f107308bfa91fcb125c99078d63aa6fc98efb54f4e44de0e |
| F5-7-25 | P:779-780 | adapt | runtime | f5-7-25 | f99887c5af397feda539ce96a039b73d824933f31ce12308ba48f322ae4711c4 |
| F5-7-26 | P:782-783 | adapt | runtime | f5-7-26 | fdf8fb51dd9894c02613c0176dc7a57cfa83e35fefbba56869635e75bd275fb4 |
| F5-8-01 | P:790-791 | replace | runtime | f5-8-01 | d0d00f4ed8e71417ceab2a9ee1bf8a97585c0feeab9ce6a6791305657956ed5b |
| F5-8-02 | P:793-801 | replace | runtime | f5-8-02 | 420bc2e01ceaddea074f8c2aa2aaf2c46379ae93b084ef552550f3343f745dd8 |
| F5-8-03 | P:803-803 | replace | runtime | f5-8-03 | e95492d2ba9b96e49ad86bc977a8db40f8d7cd1564c8f39fb13861813da81333 |
| F5-8-04 | P:805-805 | replace | runtime | f5-8-04 | 7be5511806cc4e012a29d864803c245b6014da6b40d461e67385237d96253914 |
| F5-8.1-01 | P:810-810 | adapt | runtime | f5-8-1-01 | b72fca3e762facfe0f69491785068241ceabc2517299c5f6c094fb6cd6beb94e |
| F5-8.1-02 | P:812-845 | replace | schema | f5-8-1-02 | deda3831abdeb7acf775ddcb9fd84ef3fde14091f8f9f80f60fb8831e8e34de3 |
| F5-8.2-01 | P:850-850 | adapt | runtime | f5-8-2-01 | 7da18e3296fe2ebcaac2aae5f151309ea01289b7a95a7010a41753573b5bc621 |
| F5-8.2-02 | P:852-862 | replace | schema | f5-8-2-02 | 3fc9adaafd72d702e8f4fa9187c2034f29b680a17ddb1527c97129284a6f3f5c |
| F5-8.3-01 | P:867-867 | adapt | runtime | f5-8-3-01 | 8a66885733979a2f9271c337abe02a89f405a95b5a54cdebf3767bed87c851d8 |
| F5-8.3-02 | P:869-880 | replace | schema | f5-8-3-02 | cc3fc05b3e0cfb0e4e4417957ee8517dcbc8b93d839e8acd844e4f7590e1f01e |
| F5-8.4-01 | P:885-885 | adapt | runtime | f5-8-4-01 | 281548514f4d793aa4de595e808b65f26699e5afe28b5158811e470cad483b2d |
| F5-8.4-02 | P:887-912 | replace | schema | f5-8-4-02 | d505d2e71bce1a00051098ab7d0d6dc34b8207b60cd108d5b7dc271a1565df75 |
| F5-8.5-01 | P:917-917 | adapt | runtime | f5-8-5-01 | 692859003cabdf22c2ee3fe0dc3d47e2216914c0bcb1e0e1cf77fc84d16061da |
| F5-8.5-02 | P:919-941 | replace | schema | f5-8-5-02 | d747e90b22b562f904034c394558bfd9f5f2ad4a4f23affcab63bd80ad849faa |
| F5-8.6-01 | P:946-946 | adapt | runtime | f5-8-6-01 | 1869f8dcb604bf077ea5b954e60a4c4e774195fb3bb01583a4de9a1279a1d895 |
| F5-8.6-02 | P:948-978 | replace | schema | f5-8-6-02 | 9ae8c59bb974f5d35dc38a7f29346b1f9c42632dee1172029bfa0d5d1aaab73c |
| F5-8.7-01 | P:984-984 | replace | runtime | f5-8-7-01 | c040a63eccba6e380b631d77cfdbccf3abe5c888cc26e5bcfb2784c7be3c3cd4 |
| F5-8.7-02 | P:986-1039 | adapt | runtime | f5-8-7-02 | e4e5c0523800bff0a8e2dd45df387cc20a7b5a5e1e8fa98834161a2246c452fc |
| F5-8.7-03 | P:1041-1152 | replace | schema | f5-8-7-03 | 0d4ee41615bd25ed73e4ab3161b636717a604c1b0d88a51ec5cbf1902b7c1573 |
| F5-8.8-01 | P:1157-1157 | replace | runtime | f5-8-8-01 | fbaa97df2bf261e536b6d641164a6c0d498ea430ca732798666f2c42ed933a3b |
| F5-8.8-02 | P:1159-1180 | adapt | runtime | f5-8-8-02 | 5526e044af3e2e8a30afa3e09b0ffd8215ef6da0cd9497cf135a257696a1a42c |
| F5-8.8-03 | P:1182-1238 | replace | schema | f5-8-8-03 | f4312f2c71a5b967d151547ba9dd5bca4e5751a8696d22c3fadd110950b5e369 |
| F5-8.9-01 | P:1243-1243 | adapt | runtime | f5-8-9-01 | 7b8586b993f6327361c546e96661b0a2c36c8abab27740f6b9bcdae2bd4a0637 |
| F5-8.9-02 | P:1245-1261 | replace | schema | f5-8-9-02 | d0328f562828c58acf058f7c388b4781d3bb80e0d798ebb1b68867f65948fb76 |
| F5-8.10-01 | P:1266-1266 | adapt | runtime | f5-8-10-01 | 70b7da80ea303498066dfc76843d21b3e39f254da63cf5f5cd25953c59ac5103 |
| F5-8.10-02 | P:1268-1346 | replace | schema | f5-8-10-02 | 5a4ff1369bcd0bd335edce537cb83bc6fe8b6241f72b8ccdcd8690a04cdb7707 |
| F5-8.11-01 | P:1351-1351 | adapt | runtime | f5-8-11-01 | 5e38edefead299629d0c11a4e38bda7eef12de3cb6abe5c23c655946ac640a08 |
| F5-8.11-02 | P:1353-1368 | replace | schema | f5-8-11-02 | f52390745156763cda386042534e60bad78009573eec08a30b21db1876e7eb69 |
| F5-8.12-01 | P:1373-1373 | adapt | runtime | f5-8-12-01 | ba11f82254e9726e947f6bb968b44352835eb61bd35c65595dc330a9798012de |
| F5-8.12-02 | P:1375-1384 | replace | schema | f5-8-12-02 | 33876a91115ad1829eb4f0bb04e64a2129d4ddea8b604982401c6852c1df5682 |
| F5-8.13-01 | P:1389-1389 | adapt | runtime | f5-8-13-01 | eabb196efd97d79d8181899951585def1e90b8fe948b33350fc8655b1ded64bd |
| F5-8.13-02 | P:1391-1403 | replace | schema | f5-8-13-02 | a2dfef7e14b58f4ad0776f2eec57d2041bb00c93527f0836e53f0a83936218e1 |
| F5-8.14-01 | P:1408-1408 | adapt | runtime | f5-8-14-01 | c6b3c88092adc2cc10429831578e6153feace911d34b48e4cc35160dc94f5854 |
| F5-8.14-02 | P:1410-1419 | replace | schema | f5-8-14-02 | 916cbae42e890c688cb59b7e17cd111e745e8dcb0f4b1b5e99b97407e767a41f |
| F5-8.15-01 | P:1424-1424 | adapt | runtime | f5-8-15-01 | 5ae3720f678bb28eb8b5c3390ab32629433e3bf3e95df572bb5d60748267bcdb |
| F5-8.15-02 | P:1426-1444 | replace | schema | f5-8-15-02 | 2b87c28f3b6d7e778bf18480cc923d295ed2caff7ce3efd37fb76acb4b3ccaf7 |
| F5-8.16-01 | P:1449-1449 | adapt | runtime | f5-8-16-01 | 54f75f867d2ddaa5877249a9c8701862c6e6efc03023f2a0651204c7bb597705 |
| F5-8.16-02 | P:1451-1464 | replace | schema | f5-8-16-02 | f158b2a1bd091b045dbb71e51aba4ca1e2aec7d0aeb505c82b315e8dfad608ba |
| F5-8.17-01 | P:1469-1469 | adapt | runtime | f5-8-17-01 | fd33024d61ca2c24092801d281ac709ee591a73061f434c851b647dd5f93c084 |
| F5-8.17-02 | P:1471-1524 | replace | schema | f5-8-17-02 | f5ab35d27a2978d3de3e029bba65d63c0814c80618ff113db82beee0c187a698 |
| F5-8.18-01 | P:1529-1529 | adapt | runtime | f5-8-18-01 | 440cfc48eb987e91fbeecfb4811003a8f9925cb8317358eae82c20be3b3c2f48 |
| F5-8.18-02 | P:1531-1541 | replace | schema | f5-8-18-02 | 97ded143daea81696687e3ef53789e1935c810e2e8e8fe1b6960e76d2a53358e |
| F5-9-01 | P:1548-1548 | replace | identity | f5-9-01 | 9b475bfcf95a6e60a1bc4c841a0630b7625a07ea08e09caf697979eb71cbab91 |
| F5-9-02 | P:1550-1550 | replace | identity | f5-9-02 | 1bd14ea985f2da0bda590ace58181ef91215db418b2157f0bf891c127836c7a2 |
| F5-9-03 | P:1552-1552 | replace | identity | f5-9-03 | 58db9b94cb44f0c01e41801f158ad9d575badd25c6adc0758dab4455fa8df3fd |
| F5-10-01 | P:1559-1559 | replace | api | f5-10-01 | ce3018d8b82e9426e6bb5f1e3c3814a5c2762f2e7861c78dd350e0e70a52f08b |
| F5-10-02 | P:1561-1561 | replace | api | f5-10-02 | da434e1d7a5ea904a623a1554dd3b699310deaaa67fe3bec89cb9b1b77977c1e |
| F5-10-03 | P:1563-1579 | replace | api | f5-10-03 | 2a4bc2518611353014d9975c2f46f126dd51309d863520f87baa7d85ced97a45 |
| F5-10-04 | P:1581-1581 | replace | api | f5-10-04 | 48cf633b4bd78f02fe00f1dcdbe287193e12ef6d94b4f3784bf524b125526e3c |
| F5-10-05 | P:1583-1593 | replace | api | f5-10-05 | 3357bf35f84375bd47e3870d61cf293b608b00f6947f7f6b55e7c9cac3781540 |
| F5-10-06 | P:1595-1595 | replace | api | f5-10-06 | 7091f1b960c6c9401d8f59ef723701c3cee74f33dcaecc69c38164c83d75b097 |
| F5-10-07 | P:1597-1597 | replace | api | f5-10-07 | 65831486ab08b61f35c111fdbfd1849a3eb91957fb47e633c734a1c5c2dd59c4 |
| F5-10-08 | P:1599-1610 | replace | api | f5-10-08 | a7fa8a802dd59901b489f2c407b023dd35f856808b22164814eab4cc3c42aaac |
| F5-10-09 | P:1612-1612 | replace | api | f5-10-09 | 0aa9e37897613f55844a3101074b39a60bf4e9ca045063e3cf72fcf43791bcc5 |
| F5-10-10 | P:1614-1614 | replace | api | f5-10-10 | fa88e980a74cd8e0b06ed1b3dec6f67e7d93caf36d6e4445ac90fe01089988a0 |
| F5-10-11 | P:1616-1621 | replace | api | f5-10-11 | da2cfa5c3562f93b17057ca833e1c290e799e066ab423aad52e8cba1ea423262 |
| F5-10-12 | P:1623-1623 | replace | api | f5-10-12 | 210a0f8773a0569fd4eaded23f8563694ea3438934db0d8529c349539be1dfe1 |
| F5-10-13 | P:1625-1625 | replace | api | f5-10-13 | 1db8a9c35adbd3367f155e62442dfccb357edad329466507179d92995e43c64a |
| F5-10-14 | P:1627-1647 | replace | api | f5-10-14 | 13ac3cd2b15d30c1326b68e378305b4bcb3291cd5a9d2f86ec4f63038cab0fa6 |
| F5-10-15 | P:1649-1649 | replace | api | f5-10-15 | bd6a0369bf3e32197525cb0387f82ae07df468d5fe54eb12d60a1cf90344ada7 |
| F5-10-16 | P:1651-1661 | replace | api | f5-10-16 | e8a473084f473123f37d14f5ac3cf121944671072583f4454b11bc02ec81b5d6 |
| F5-10-17 | P:1663-1663 | replace | api | f5-10-17 | a29e7f9b2d03b716e0e58b4e336279edc019e2f4459a545eab0413f8faa7173f |
| F5-10-18 | P:1665-1665 | replace | api | f5-10-18 | 8790279c1e9903e53fa3044fbd341ca8ab6c0e1db1bec751af8585d97b15376c |
| F5-10-19 | P:1667-1677 | replace | api | f5-10-19 | 20dd3df27151968e5f4edfceb6cc3e03b37a4d1628e499c399d7a5b369c8bf71 |
| F5-10-20 | P:1679-1679 | replace | api | f5-10-20 | 56cde8e8be149c28fc51c8423b4ef8c589682f624ffd0c1a87611b8a9fb452b9 |
| F5-10-21 | P:1681-1700 | replace | api | f5-10-21 | 694dccd852c13e7097fcb5885f62ed5b4317772d9f8d1ea0eef9f71e96771ea6 |
| F5-10-22 | P:1702-1702 | replace | api | f5-10-22 | 8ba57748d38bc0116af14b02807e395239c4f153bec98722627d149315c65490 |
| F5-10-23 | P:1704-1713 | replace | api | f5-10-23 | 1befc54c8e247eae538de842b0e146a0c3f61c8d19e8cf031850e44babbf35be |
| F5-10-24 | P:1715-1715 | replace | api | f5-10-24 | 6e67ec192770ab450fd771981d12c44c076728cb72278b588466927ccc7c771d |
| F5-11-01 | P:1722-1722 | replace | runtime | f5-11-01 | 70beed4162cc59a9276bdefa0592e52b0a75f05bfa2a35fa0f3647c038a475f6 |
| F5-11-02 | P:1724-1724 | replace | runtime | f5-11-02 | a6cf7c9529d9e061654bc2d42c5c0709ae563622380d53e6e28f507f7e16531e |
| F5-11-03 | P:1725-1728 | replace | runtime | f5-11-03 | ca4690f5953753c00fd8c64550ead92329e76d87aa1361a209cf11c59d0fb6e8 |
| F5-11-04 | P:1729-1729 | replace | runtime | f5-11-04 | 4b9a3904b4d6096b6a4432f4e75dd2f3cd96acabb24c2c80da106ed612000e20 |
| F5-11-05 | P:1730-1730 | replace | runtime | f5-11-05 | 13a3d20f7bfb4c6a83938c3cb687e19df2daa1f362fc17b13d71f9fbeb69a3bd |
| F5-11-06 | P:1731-1731 | replace | runtime | f5-11-06 | 9105b6fe33919dfb448b388047d6eb6ea9a0855acb9112a86d9a682115c9b3cd |
| F5-11-07 | P:1732-1732 | replace | runtime | f5-11-07 | 3b726b3bd912121b72c73e253e43d24de7acba459786645ebcd3ed670c087457 |
| F5-11-08 | P:1734-1734 | replace | runtime | f5-11-08 | 370edf775ec7680f9807dbd27c19f0f5baffc7ed982208887232948c65b01065 |
| F5-11-09 | P:1736-1739 | replace | runtime | f5-11-09 | 859ef917d12e6ff4520c57066a2127deb78db9082a06d4b1fef184aea8b0d35f |
| F5-12-01 | P:1746-1746 | replace | runtime | f5-12-01 | ba547dc42e27c9edded2e54560370fb37ffa5a803f5c9925545490522d638dc0 |
| F5-13-01 | P:1753-1753 | replace | runtime | f5-13-01 | e6cf709c64c9fa594b3f60b70403ae01869a18ef5ca75e2cde7b61f058cbabcf |
| F5-13-02 | P:1755-1755 | replace | runtime | f5-13-02 | d7875556a151dc6582b134dd4c5ceab5ba81685d56304231f1d3658e0f625475 |
| F5-13-03 | P:1757-1757 | replace | runtime | f5-13-03 | 721ab20351fbba934ce994112fa42bfe56fccbefbdde3c8b1aa20a57f8157872 |
| F5-13-04 | P:1759-1759 | replace | runtime | f5-13-04 | e7caafca844b1ad55dc4a6210124efaacd906174f1d75de80628e4b1add558cb |
| F5-13-05 | P:1761-1761 | replace | runtime | f5-13-05 | 7a7a1f1b5235273f7019367fd75656661062e53904ed6f0c90bac7cf5cd90b03 |
| F5-13-06 | P:1763-1763 | replace | runtime | f5-13-06 | 99a412ef84e6c97d7c02055fe6c03a752b5aa89647995b13d93ddbb03dc28d27 |
| F5-13-07 | P:1765-1765 | replace | runtime | f5-13-07 | 1b9def5dbb7db23ce8ef9de2cacefa3066770719fe90e8f72d410913e75ff041 |
| F5-13-08 | P:1767-1767 | replace | runtime | f5-13-08 | 753de505da77994fc3715b40fbff0060c8f131521186efcfcb161128b4c1a490 |
| F5-13-09 | P:1769-1769 | replace | runtime | f5-13-09 | 40f2959c515ca7be3dc6291cbebc795c577b5fd562713df72502c0225dcbef3c |
| F5-14-01 | P:1776-1778 | replace | runtime | f5-14-01 | 5e49f7e146337c823fafe7fd43aceaf83fb291c554a811d1ea7e9682deaf18fb |
| F5-14-02 | P:1780-1780 | replace | runtime | f5-14-02 | 3defd355db2756c08f4aff4edd875117f7f54ba057b3e27f1aa566fcd3224e46 |
| F5-15-01 | P:1787-1787 | replace | files | f5-15-01 | 438379bedc99534f697b1c832413edd02ac49f78b6880e681348da7c7d0ce5a9 |
| F5-15-02 | P:1788-1788 | replace | files | f5-15-02 | 271bb83468174d6b2aab3940a1ff31ab5a2b0e0c1112bfc0e28450dedffe171e |
| F5-15-03 | P:1789-1789 | replace | files | f5-15-03 | f15338bdd39b7e17eed318b38c689b494626df2deecd82c56d9e5f65e1ccb4aa |
| F5-15-04 | P:1790-1790 | replace | files | f5-15-04 | adb8cc7dd731534b1adec35e674c9f57ab2773b7704522578eb279438b581817 |
| F5-15-05 | P:1791-1791 | replace | files | f5-15-05 | 7c311ef97b084dfbb4f1b56acc443cf0163903fa3b22c611ee223b0d59164eb7 |
| F5-15-06 | P:1792-1792 | replace | files | f5-15-06 | 8e8319c49a2b544009503a9902f9afd92b1ff4f3b70e820c82965412ff5b283d |
| F5-15-07 | P:1794-1794 | replace | files | f5-15-07 | 255698c1854302e52c5e5fb8b6bbe315773df1e7906d4137f9f94085a187e7e1 |
| F5-16-01 | P:1801-1801 | replace | attribution | f5-16-01 | 9403d596ae159a3e05705629cdf8a9ae12a4e63212e53f85fe2f0c01032abac4 |
| F5-16-02 | P:1805-1805 | replace | attribution | f5-16-02 | f6e8975dc1f8c429cd24f63b8bf4ec3c40bdb8267b0dded6574667baa429f0a5 |
| TD-Tool-Summary-01 | D:9-28 | adapt | runtime | f5-8-04 | 7be5511806cc4e012a29d864803c245b6014da6b40d461e67385237d96253914 |
| TD-ask_user_input_v0-01 | D:34-34 | adapt | runtime | f5-8-1-01 | b72fca3e762facfe0f69491785068241ceabc2517299c5f6c094fb6cd6beb94e |
| TD-ask_user_input_v0-02 | D:36-36 | adapt | runtime | f5-8-1-01 | b72fca3e762facfe0f69491785068241ceabc2517299c5f6c094fb6cd6beb94e |
| TD-ask_user_input_v0-03 | D:38-38 | adapt | runtime | f5-8-1-01 | b72fca3e762facfe0f69491785068241ceabc2517299c5f6c094fb6cd6beb94e |
| TD-ask_user_input_v0-04 | D:39-39 | adapt | runtime | f5-8-1-01 | b72fca3e762facfe0f69491785068241ceabc2517299c5f6c094fb6cd6beb94e |
| TD-ask_user_input_v0-05 | D:40-40 | adapt | runtime | f5-8-1-01 | b72fca3e762facfe0f69491785068241ceabc2517299c5f6c094fb6cd6beb94e |
| TD-ask_user_input_v0-06 | D:41-41 | adapt | runtime | f5-8-1-01 | b72fca3e762facfe0f69491785068241ceabc2517299c5f6c094fb6cd6beb94e |
| TD-ask_user_input_v0-07 | D:42-42 | adapt | runtime | f5-8-1-01 | b72fca3e762facfe0f69491785068241ceabc2517299c5f6c094fb6cd6beb94e |
| TD-ask_user_input_v0-08 | D:44-44 | adapt | runtime | f5-8-1-01 | b72fca3e762facfe0f69491785068241ceabc2517299c5f6c094fb6cd6beb94e |
| TD-ask_user_input_v0-09 | D:46-46 | adapt | runtime | f5-8-1-01 | b72fca3e762facfe0f69491785068241ceabc2517299c5f6c094fb6cd6beb94e |
| TD-ask_user_input_v0-10 | D:47-47 | adapt | runtime | f5-8-1-01 | b72fca3e762facfe0f69491785068241ceabc2517299c5f6c094fb6cd6beb94e |
| TD-ask_user_input_v0-11 | D:48-48 | adapt | runtime | f5-8-1-01 | b72fca3e762facfe0f69491785068241ceabc2517299c5f6c094fb6cd6beb94e |
| TD-ask_user_input_v0-12 | D:49-49 | adapt | runtime | f5-8-1-01 | b72fca3e762facfe0f69491785068241ceabc2517299c5f6c094fb6cd6beb94e |
| TD-ask_user_input_v0-13 | D:50-50 | adapt | runtime | f5-8-1-01 | b72fca3e762facfe0f69491785068241ceabc2517299c5f6c094fb6cd6beb94e |
| TD-ask_user_input_v0-14 | D:51-51 | adapt | runtime | f5-8-1-01 | b72fca3e762facfe0f69491785068241ceabc2517299c5f6c094fb6cd6beb94e |
| TD-ask_user_input_v0-15 | D:52-52 | adapt | runtime | f5-8-1-01 | b72fca3e762facfe0f69491785068241ceabc2517299c5f6c094fb6cd6beb94e |
| TD-ask_user_input_v0-16 | D:54-54 | adapt | runtime | f5-8-1-01 | b72fca3e762facfe0f69491785068241ceabc2517299c5f6c094fb6cd6beb94e |
| TD-ask_user_input_v0-17 | D:56-56 | replace | schema | f5-8-1-02 | deda3831abdeb7acf775ddcb9fd84ef3fde14091f8f9f80f60fb8831e8e34de3 |
| TD-ask_user_input_v0-18 | D:58-91 | replace | schema | f5-8-1-02 | deda3831abdeb7acf775ddcb9fd84ef3fde14091f8f9f80f60fb8831e8e34de3 |
| TD-bash_tool-01 | D:97-97 | adapt | runtime | f5-8-2-01 | 7da18e3296fe2ebcaac2aae5f151309ea01289b7a95a7010a41753573b5bc621 |
| TD-bash_tool-02 | D:99-99 | replace | schema | f5-8-2-02 | 3fc9adaafd72d702e8f4fa9187c2034f29b680a17ddb1527c97129284a6f3f5c |
| TD-bash_tool-03 | D:101-111 | replace | schema | f5-8-2-02 | 3fc9adaafd72d702e8f4fa9187c2034f29b680a17ddb1527c97129284a6f3f5c |
| TD-create_file-01 | D:117-117 | adapt | runtime | f5-8-3-01 | 8a66885733979a2f9271c337abe02a89f405a95b5a54cdebf3767bed87c851d8 |
| TD-create_file-02 | D:119-119 | replace | schema | f5-8-3-02 | cc3fc05b3e0cfb0e4e4417957ee8517dcbc8b93d839e8acd844e4f7590e1f01e |
| TD-create_file-03 | D:121-132 | replace | schema | f5-8-3-02 | cc3fc05b3e0cfb0e4e4417957ee8517dcbc8b93d839e8acd844e4f7590e1f01e |
| TD-fetch_sports_data-01 | D:138-138 | adapt | runtime | f5-8-4-01 | 281548514f4d793aa4de595e808b65f26699e5afe28b5158811e470cad483b2d |
| TD-fetch_sports_data-02 | D:140-140 | replace | schema | f5-8-4-02 | d505d2e71bce1a00051098ab7d0d6dc34b8207b60cd108d5b7dc271a1565df75 |
| TD-fetch_sports_data-03 | D:142-167 | replace | schema | f5-8-4-02 | d505d2e71bce1a00051098ab7d0d6dc34b8207b60cd108d5b7dc271a1565df75 |
| TD-image_search-01 | D:173-173 | adapt | runtime | f5-8-5-01 | 692859003cabdf22c2ee3fe0dc3d47e2216914c0bcb1e0e1cf77fc84d16061da |
| TD-image_search-02 | D:175-175 | replace | schema | f5-8-5-02 | d747e90b22b562f904034c394558bfd9f5f2ad4a4f23affcab63bd80ad849faa |
| TD-image_search-03 | D:177-199 | replace | schema | f5-8-5-02 | d747e90b22b562f904034c394558bfd9f5f2ad4a4f23affcab63bd80ad849faa |
| TD-message_compose_v1-01 | D:205-205 | adapt | runtime | f5-8-6-01 | 1869f8dcb604bf077ea5b954e60a4c4e774195fb3bb01583a4de9a1279a1d895 |
| TD-message_compose_v1-02 | D:207-207 | adapt | runtime | f5-8-6-01 | 1869f8dcb604bf077ea5b954e60a4c4e774195fb3bb01583a4de9a1279a1d895 |
| TD-message_compose_v1-03 | D:209-209 | adapt | runtime | f5-8-6-01 | 1869f8dcb604bf077ea5b954e60a4c4e774195fb3bb01583a4de9a1279a1d895 |
| TD-message_compose_v1-04 | D:211-211 | replace | schema | f5-8-6-02 | 9ae8c59bb974f5d35dc38a7f29346b1f9c42632dee1172029bfa0d5d1aaab73c |
| TD-message_compose_v1-05 | D:213-243 | replace | schema | f5-8-6-02 | 9ae8c59bb974f5d35dc38a7f29346b1f9c42632dee1172029bfa0d5d1aaab73c |
| TD-places_map_display_v0-01 | D:249-249 | adapt | runtime | f5-8-7-02 | e4e5c0523800bff0a8e2dd45df387cc20a7b5a5e1e8fa98834161a2246c452fc |
| TD-places_map_display_v0-02 | D:251-251 | adapt | runtime | f5-8-7-02 | e4e5c0523800bff0a8e2dd45df387cc20a7b5a5e1e8fa98834161a2246c452fc |
| TD-places_map_display_v0-03 | D:252-252 | adapt | runtime | f5-8-7-02 | e4e5c0523800bff0a8e2dd45df387cc20a7b5a5e1e8fa98834161a2246c452fc |
| TD-places_map_display_v0-04 | D:253-253 | adapt | runtime | f5-8-7-02 | e4e5c0523800bff0a8e2dd45df387cc20a7b5a5e1e8fa98834161a2246c452fc |
| TD-places_map_display_v0-05 | D:255-255 | adapt | runtime | f5-8-7-02 | e4e5c0523800bff0a8e2dd45df387cc20a7b5a5e1e8fa98834161a2246c452fc |
| TD-places_map_display_v0-06 | D:257-257 | adapt | runtime | f5-8-7-02 | e4e5c0523800bff0a8e2dd45df387cc20a7b5a5e1e8fa98834161a2246c452fc |
| TD-places_map_display_v0-07 | D:259-259 | adapt | runtime | f5-8-7-02 | e4e5c0523800bff0a8e2dd45df387cc20a7b5a5e1e8fa98834161a2246c452fc |
| TD-places_map_display_v0-08 | D:260-271 | replace | schema | f5-8-7-03 | 0d4ee41615bd25ed73e4ab3161b636717a604c1b0d88a51ec5cbf1902b7c1573 |
| TD-places_map_display_v0-09 | D:273-273 | adapt | runtime | f5-8-7-02 | e4e5c0523800bff0a8e2dd45df387cc20a7b5a5e1e8fa98834161a2246c452fc |
| TD-places_map_display_v0-10 | D:274-297 | replace | schema | f5-8-7-03 | 0d4ee41615bd25ed73e4ab3161b636717a604c1b0d88a51ec5cbf1902b7c1573 |
| TD-places_map_display_v0-11 | D:299-299 | adapt | runtime | f5-8-7-02 | e4e5c0523800bff0a8e2dd45df387cc20a7b5a5e1e8fa98834161a2246c452fc |
| TD-places_map_display_v0-12 | D:300-300 | adapt | runtime | f5-8-7-02 | e4e5c0523800bff0a8e2dd45df387cc20a7b5a5e1e8fa98834161a2246c452fc |
| TD-places_map_display_v0-13 | D:301-301 | adapt | runtime | f5-8-7-02 | e4e5c0523800bff0a8e2dd45df387cc20a7b5a5e1e8fa98834161a2246c452fc |
| TD-places_map_display_v0-14 | D:302-302 | adapt | runtime | f5-8-7-02 | e4e5c0523800bff0a8e2dd45df387cc20a7b5a5e1e8fa98834161a2246c452fc |
| TD-places_map_display_v0-15 | D:303-303 | adapt | runtime | f5-8-7-02 | e4e5c0523800bff0a8e2dd45df387cc20a7b5a5e1e8fa98834161a2246c452fc |
| TD-places_map_display_v0-16 | D:304-304 | adapt | runtime | f5-8-7-02 | e4e5c0523800bff0a8e2dd45df387cc20a7b5a5e1e8fa98834161a2246c452fc |
| TD-places_map_display_v0-17 | D:306-306 | replace | schema | f5-8-7-03 | 0d4ee41615bd25ed73e4ab3161b636717a604c1b0d88a51ec5cbf1902b7c1573 |
| TD-places_map_display_v0-18 | D:308-419 | replace | schema | f5-8-7-03 | 0d4ee41615bd25ed73e4ab3161b636717a604c1b0d88a51ec5cbf1902b7c1573 |
| TD-places_search-01 | D:425-425 | adapt | runtime | f5-8-8-02 | 5526e044af3e2e8a30afa3e09b0ffd8215ef6da0cd9497cf135a257696a1a42c |
| TD-places_search-02 | D:427-427 | adapt | runtime | f5-8-8-02 | 5526e044af3e2e8a30afa3e09b0ffd8215ef6da0cd9497cf135a257696a1a42c |
| TD-places_search-03 | D:428-428 | adapt | runtime | f5-8-8-02 | 5526e044af3e2e8a30afa3e09b0ffd8215ef6da0cd9497cf135a257696a1a42c |
| TD-places_search-04 | D:429-429 | adapt | runtime | f5-8-8-02 | 5526e044af3e2e8a30afa3e09b0ffd8215ef6da0cd9497cf135a257696a1a42c |
| TD-places_search-05 | D:431-431 | adapt | runtime | f5-8-8-02 | 5526e044af3e2e8a30afa3e09b0ffd8215ef6da0cd9497cf135a257696a1a42c |
| TD-places_search-06 | D:432-440 | replace | schema | f5-8-8-03 | f4312f2c71a5b967d151547ba9dd5bca4e5751a8696d22c3fadd110950b5e369 |
| TD-places_search-07 | D:442-444 | adapt | runtime | f5-8-8-02 | 5526e044af3e2e8a30afa3e09b0ffd8215ef6da0cd9497cf135a257696a1a42c |
| TD-places_search-08 | D:446-446 | adapt | runtime | f5-8-8-02 | 5526e044af3e2e8a30afa3e09b0ffd8215ef6da0cd9497cf135a257696a1a42c |
| TD-places_search-09 | D:448-448 | replace | schema | f5-8-8-03 | f4312f2c71a5b967d151547ba9dd5bca4e5751a8696d22c3fadd110950b5e369 |
| TD-places_search-10 | D:450-506 | replace | schema | f5-8-8-03 | f4312f2c71a5b967d151547ba9dd5bca4e5751a8696d22c3fadd110950b5e369 |
| TD-present_files-01 | D:512-512 | adapt | runtime | f5-8-9-01 | 7b8586b993f6327361c546e96661b0a2c36c8abab27740f6b9bcdae2bd4a0637 |
| TD-present_files-02 | D:514-514 | adapt | runtime | f5-8-9-01 | 7b8586b993f6327361c546e96661b0a2c36c8abab27740f6b9bcdae2bd4a0637 |
| TD-present_files-03 | D:515-515 | adapt | runtime | f5-8-9-01 | 7b8586b993f6327361c546e96661b0a2c36c8abab27740f6b9bcdae2bd4a0637 |
| TD-present_files-04 | D:516-516 | adapt | runtime | f5-8-9-01 | 7b8586b993f6327361c546e96661b0a2c36c8abab27740f6b9bcdae2bd4a0637 |
| TD-present_files-05 | D:517-517 | adapt | runtime | f5-8-9-01 | 7b8586b993f6327361c546e96661b0a2c36c8abab27740f6b9bcdae2bd4a0637 |
| TD-present_files-06 | D:519-519 | adapt | runtime | f5-8-9-01 | 7b8586b993f6327361c546e96661b0a2c36c8abab27740f6b9bcdae2bd4a0637 |
| TD-present_files-07 | D:520-520 | adapt | runtime | f5-8-9-01 | 7b8586b993f6327361c546e96661b0a2c36c8abab27740f6b9bcdae2bd4a0637 |
| TD-present_files-08 | D:521-521 | adapt | runtime | f5-8-9-01 | 7b8586b993f6327361c546e96661b0a2c36c8abab27740f6b9bcdae2bd4a0637 |
| TD-present_files-09 | D:523-523 | adapt | runtime | f5-8-9-01 | 7b8586b993f6327361c546e96661b0a2c36c8abab27740f6b9bcdae2bd4a0637 |
| TD-present_files-10 | D:524-524 | adapt | runtime | f5-8-9-01 | 7b8586b993f6327361c546e96661b0a2c36c8abab27740f6b9bcdae2bd4a0637 |
| TD-present_files-11 | D:525-525 | adapt | runtime | f5-8-9-01 | 7b8586b993f6327361c546e96661b0a2c36c8abab27740f6b9bcdae2bd4a0637 |
| TD-present_files-12 | D:526-526 | adapt | runtime | f5-8-9-01 | 7b8586b993f6327361c546e96661b0a2c36c8abab27740f6b9bcdae2bd4a0637 |
| TD-present_files-13 | D:527-527 | adapt | runtime | f5-8-9-01 | 7b8586b993f6327361c546e96661b0a2c36c8abab27740f6b9bcdae2bd4a0637 |
| TD-present_files-14 | D:528-528 | adapt | runtime | f5-8-9-01 | 7b8586b993f6327361c546e96661b0a2c36c8abab27740f6b9bcdae2bd4a0637 |
| TD-present_files-15 | D:529-529 | adapt | runtime | f5-8-9-01 | 7b8586b993f6327361c546e96661b0a2c36c8abab27740f6b9bcdae2bd4a0637 |
| TD-present_files-16 | D:531-531 | replace | schema | f5-8-9-02 | d0328f562828c58acf058f7c388b4781d3bb80e0d798ebb1b68867f65948fb76 |
| TD-present_files-17 | D:533-549 | replace | schema | f5-8-9-02 | d0328f562828c58acf058f7c388b4781d3bb80e0d798ebb1b68867f65948fb76 |
| TD-recipe_display_v0-01 | D:555-555 | adapt | runtime | f5-8-10-01 | 70b7da80ea303498066dfc76843d21b3e39f254da63cf5f5cd25953c59ac5103 |
| TD-recipe_display_v0-02 | D:557-557 | replace | schema | f5-8-10-02 | 5a4ff1369bcd0bd335edce537cb83bc6fe8b6241f72b8ccdcd8690a04cdb7707 |
| TD-recipe_display_v0-03 | D:559-637 | replace | schema | f5-8-10-02 | 5a4ff1369bcd0bd335edce537cb83bc6fe8b6241f72b8ccdcd8690a04cdb7707 |
| TD-recommend_claude_apps-01 | D:643-643 | adapt | runtime | f5-8-11-01 | 5e38edefead299629d0c11a4e38bda7eef12de3cb6abe5c23c655946ac640a08 |
| TD-recommend_claude_apps-02 | D:645-645 | replace | schema | f5-8-11-02 | f52390745156763cda386042534e60bad78009573eec08a30b21db1876e7eb69 |
| TD-recommend_claude_apps-03 | D:647-662 | replace | schema | f5-8-11-02 | f52390745156763cda386042534e60bad78009573eec08a30b21db1876e7eb69 |
| TD-search_mcp_registry-01 | D:668-668 | adapt | runtime | f5-8-12-01 | ba11f82254e9726e947f6bb968b44352835eb61bd35c65595dc330a9798012de |
| TD-search_mcp_registry-02 | D:670-670 | adapt | runtime | f5-8-12-01 | ba11f82254e9726e947f6bb968b44352835eb61bd35c65595dc330a9798012de |
| TD-search_mcp_registry-03 | D:671-671 | adapt | runtime | f5-8-12-01 | ba11f82254e9726e947f6bb968b44352835eb61bd35c65595dc330a9798012de |
| TD-search_mcp_registry-04 | D:672-672 | adapt | runtime | f5-8-12-01 | ba11f82254e9726e947f6bb968b44352835eb61bd35c65595dc330a9798012de |
| TD-search_mcp_registry-05 | D:674-674 | adapt | runtime | f5-8-12-01 | ba11f82254e9726e947f6bb968b44352835eb61bd35c65595dc330a9798012de |
| TD-search_mcp_registry-06 | D:675-675 | adapt | runtime | f5-8-12-01 | ba11f82254e9726e947f6bb968b44352835eb61bd35c65595dc330a9798012de |
| TD-search_mcp_registry-07 | D:676-676 | adapt | runtime | f5-8-12-01 | ba11f82254e9726e947f6bb968b44352835eb61bd35c65595dc330a9798012de |
| TD-search_mcp_registry-08 | D:677-677 | adapt | runtime | f5-8-12-01 | ba11f82254e9726e947f6bb968b44352835eb61bd35c65595dc330a9798012de |
| TD-search_mcp_registry-09 | D:678-678 | adapt | runtime | f5-8-12-01 | ba11f82254e9726e947f6bb968b44352835eb61bd35c65595dc330a9798012de |
| TD-search_mcp_registry-10 | D:679-679 | adapt | runtime | f5-8-12-01 | ba11f82254e9726e947f6bb968b44352835eb61bd35c65595dc330a9798012de |
| TD-search_mcp_registry-11 | D:680-680 | adapt | runtime | f5-8-12-01 | ba11f82254e9726e947f6bb968b44352835eb61bd35c65595dc330a9798012de |
| TD-search_mcp_registry-12 | D:682-682 | adapt | runtime | f5-8-12-01 | ba11f82254e9726e947f6bb968b44352835eb61bd35c65595dc330a9798012de |
| TD-search_mcp_registry-13 | D:684-684 | replace | schema | f5-8-12-02 | 33876a91115ad1829eb4f0bb04e64a2129d4ddea8b604982401c6852c1df5682 |
| TD-search_mcp_registry-14 | D:686-695 | replace | schema | f5-8-12-02 | 33876a91115ad1829eb4f0bb04e64a2129d4ddea8b604982401c6852c1df5682 |
| TD-str_replace-01 | D:701-701 | adapt | runtime | f5-8-13-01 | eabb196efd97d79d8181899951585def1e90b8fe948b33350fc8655b1ded64bd |
| TD-str_replace-02 | D:703-703 | replace | schema | f5-8-13-02 | a2dfef7e14b58f4ad0776f2eec57d2041bb00c93527f0836e53f0a83936218e1 |
| TD-str_replace-03 | D:705-717 | replace | schema | f5-8-13-02 | a2dfef7e14b58f4ad0776f2eec57d2041bb00c93527f0836e53f0a83936218e1 |
| TD-suggest_connectors-01 | D:723-723 | adapt | runtime | f5-8-14-01 | c6b3c88092adc2cc10429831578e6153feace911d34b48e4cc35160dc94f5854 |
| TD-suggest_connectors-02 | D:725-725 | adapt | runtime | f5-8-14-01 | c6b3c88092adc2cc10429831578e6153feace911d34b48e4cc35160dc94f5854 |
| TD-suggest_connectors-03 | D:726-726 | adapt | runtime | f5-8-14-01 | c6b3c88092adc2cc10429831578e6153feace911d34b48e4cc35160dc94f5854 |
| TD-suggest_connectors-04 | D:727-727 | adapt | runtime | f5-8-14-01 | c6b3c88092adc2cc10429831578e6153feace911d34b48e4cc35160dc94f5854 |
| TD-suggest_connectors-05 | D:728-728 | adapt | runtime | f5-8-14-01 | c6b3c88092adc2cc10429831578e6153feace911d34b48e4cc35160dc94f5854 |
| TD-suggest_connectors-06 | D:729-729 | adapt | runtime | f5-8-14-01 | c6b3c88092adc2cc10429831578e6153feace911d34b48e4cc35160dc94f5854 |
| TD-suggest_connectors-07 | D:731-731 | adapt | runtime | f5-8-14-01 | c6b3c88092adc2cc10429831578e6153feace911d34b48e4cc35160dc94f5854 |
| TD-suggest_connectors-08 | D:733-733 | adapt | runtime | f5-8-14-01 | c6b3c88092adc2cc10429831578e6153feace911d34b48e4cc35160dc94f5854 |
| TD-suggest_connectors-09 | D:735-735 | replace | schema | f5-8-14-02 | 916cbae42e890c688cb59b7e17cd111e745e8dcb0f4b1b5e99b97407e767a41f |
| TD-suggest_connectors-10 | D:737-746 | replace | schema | f5-8-14-02 | 916cbae42e890c688cb59b7e17cd111e745e8dcb0f4b1b5e99b97407e767a41f |
| TD-view-01 | D:752-752 | adapt | runtime | f5-8-15-01 | 5ae3720f678bb28eb8b5c3390ab32629433e3bf3e95df572bb5d60748267bcdb |
| TD-view-02 | D:754-754 | adapt | runtime | f5-8-15-01 | 5ae3720f678bb28eb8b5c3390ab32629433e3bf3e95df572bb5d60748267bcdb |
| TD-view-03 | D:755-755 | adapt | runtime | f5-8-15-01 | 5ae3720f678bb28eb8b5c3390ab32629433e3bf3e95df572bb5d60748267bcdb |
| TD-view-04 | D:756-756 | adapt | runtime | f5-8-15-01 | 5ae3720f678bb28eb8b5c3390ab32629433e3bf3e95df572bb5d60748267bcdb |
| TD-view-05 | D:757-757 | adapt | runtime | f5-8-15-01 | 5ae3720f678bb28eb8b5c3390ab32629433e3bf3e95df572bb5d60748267bcdb |
| TD-view-06 | D:759-759 | adapt | runtime | f5-8-15-01 | 5ae3720f678bb28eb8b5c3390ab32629433e3bf3e95df572bb5d60748267bcdb |
| TD-view-07 | D:761-761 | replace | schema | f5-8-15-02 | 2b87c28f3b6d7e778bf18480cc923d295ed2caff7ce3efd37fb76acb4b3ccaf7 |
| TD-view-08 | D:763-781 | replace | schema | f5-8-15-02 | 2b87c28f3b6d7e778bf18480cc923d295ed2caff7ce3efd37fb76acb4b3ccaf7 |
| TD-weather_fetch-01 | D:787-787 | adapt | runtime | f5-8-16-01 | 54f75f867d2ddaa5877249a9c8701862c6e6efc03023f2a0651204c7bb597705 |
| TD-weather_fetch-02 | D:789-789 | adapt | runtime | f5-8-16-01 | 54f75f867d2ddaa5877249a9c8701862c6e6efc03023f2a0651204c7bb597705 |
| TD-weather_fetch-03 | D:790-790 | adapt | runtime | f5-8-16-01 | 54f75f867d2ddaa5877249a9c8701862c6e6efc03023f2a0651204c7bb597705 |
| TD-weather_fetch-04 | D:791-791 | adapt | runtime | f5-8-16-01 | 54f75f867d2ddaa5877249a9c8701862c6e6efc03023f2a0651204c7bb597705 |
| TD-weather_fetch-05 | D:792-792 | adapt | runtime | f5-8-16-01 | 54f75f867d2ddaa5877249a9c8701862c6e6efc03023f2a0651204c7bb597705 |
| TD-weather_fetch-06 | D:793-793 | adapt | runtime | f5-8-16-01 | 54f75f867d2ddaa5877249a9c8701862c6e6efc03023f2a0651204c7bb597705 |
| TD-weather_fetch-07 | D:795-795 | adapt | runtime | f5-8-16-01 | 54f75f867d2ddaa5877249a9c8701862c6e6efc03023f2a0651204c7bb597705 |
| TD-weather_fetch-08 | D:796-796 | adapt | runtime | f5-8-16-01 | 54f75f867d2ddaa5877249a9c8701862c6e6efc03023f2a0651204c7bb597705 |
| TD-weather_fetch-09 | D:797-797 | adapt | runtime | f5-8-16-01 | 54f75f867d2ddaa5877249a9c8701862c6e6efc03023f2a0651204c7bb597705 |
| TD-weather_fetch-10 | D:799-799 | replace | schema | f5-8-16-02 | f158b2a1bd091b045dbb71e51aba4ca1e2aec7d0aeb505c82b315e8dfad608ba |
| TD-weather_fetch-11 | D:801-814 | replace | schema | f5-8-16-02 | f158b2a1bd091b045dbb71e51aba4ca1e2aec7d0aeb505c82b315e8dfad608ba |
| TD-web_fetch-01 | D:820-820 | adapt | runtime | f5-8-17-01 | fd33024d61ca2c24092801d281ac709ee591a73061f434c851b647dd5f93c084 |
| TD-web_fetch-02 | D:822-822 | replace | schema | f5-8-17-02 | f5ab35d27a2978d3de3e029bba65d63c0814c80618ff113db82beee0c187a698 |
| TD-web_fetch-03 | D:824-877 | replace | schema | f5-8-17-02 | f5ab35d27a2978d3de3e029bba65d63c0814c80618ff113db82beee0c187a698 |
| TD-web_search-01 | D:883-883 | adapt | runtime | f5-8-18-01 | 440cfc48eb987e91fbeecfb4811003a8f9925cb8317358eae82c20be3b3c2f48 |
| TD-web_search-02 | D:885-885 | replace | schema | f5-8-18-02 | 97ded143daea81696687e3ef53789e1935c810e2e8e8fe1b6960e76d2a53358e |
| TD-web_search-03 | D:887-897 | replace | schema | f5-8-18-02 | 97ded143daea81696687e3ef53789e1935c810e2e8e8fe1b6960e76d2a53358e |
| TD-web_search-04 | D:901-901 | adapt | attribution | f5-16-02 | f6e8975dc1f8c429cd24f63b8bf4ec3c40bdb8267b0dded6574667baa429f0a5 |
| TD-web_search-05 | D:903-903 | adapt | attribution | f5-16-02 | f6e8975dc1f8c429cd24f63b8bf4ec3c40bdb8267b0dded6574667baa429f0a5 |
| TD-web_search-06 | D:905-905 | adapt | attribution | f5-16-02 | f6e8975dc1f8c429cd24f63b8bf4ec3c40bdb8267b0dded6574667baa429f0a5 |
| TD-web_search-07 | D:907-907 | adapt | attribution | f5-16-02 | f6e8975dc1f8c429cd24f63b8bf4ec3c40bdb8267b0dded6574667baa429f0a5 |
