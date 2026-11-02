# Codex capability matrix

This matrix translates the *workflow intent* of the historical Fable 5 tool catalogue into capability categories. It is not an API reference. Codex tools vary by host, client, configuration, permissions, and installed connectors. Discover the current registry and inspect each selected tool's live description/schema before use.

| Archived Fable 5 capability | Codex-side capability to discover | Adaptation rule |
| --- | --- | --- |
| User preference elicitation | Conversational clarification or supported interactive input | Ask only for a material missing constraint; do not force a questionnaire |
| Shell execution | Current shell/command execution surface | Inspect environment; use bounded, reviewable commands |
| File creation and editing | Workspace/file tools or shell/editor | Verify exact paths and inspect resulting files |
| Sports data | Current sports data connector or authoritative live source | Fetch current event data; do not guess fixtures or scores |
| Image search | Current image search/retrieval capability | Use only when imagery materially helps and the request is appropriate |
| Message composition | Drafting/writing experience | Draft only; sending requires explicit authorization |
| Places search and maps | Local-business/place search and supported map/directions capability | Use structured place results; never invent locations or route metrics |
| File presentation | Supported artifact/file delivery surface | Verify created artifact and exact destination |
| Recipe presentation | Structured recipe or ordinary text output | Preserve quantities, units, timing, and food-safety context |
| App recommendations | Current plugin/connector discovery | Search available integrations; user chooses before partner actions where required |
| MCP registry | Live tool/connector discovery | Use current registry results, never archived IDs |
| Text replacement | Current patch/editing tool | Read immediately before edit; review diff after |
| File/image viewing | Current file reader or image viewer | Choose by file type; inspect scans visually when needed |
| Weather | Current weather utility/data source | Resolve requested location and current time correctly |
| Web fetch/search | Current search and page retrieval | Read sources; cite with the host's citation format |
| Provider API in generated artifacts | Documented API/SDK or connected service, if actually available | Never assume ambient credentials or hidden proxy authentication |
| Legacy citation tags | Current citation mechanism | Do not emit legacy syntax or fabricate source IDs |
| Fixed filesystem/network configuration | Environment inspection and current host docs | Never copy archived paths or allowlists into Codex |

## Stable workflow families

| Need | How to choose |
| --- | --- |
| Repository inspection/editing | Use the current workspace, shell, and patch tools actually exposed |
| Skills | Use the current skill registry and read relevant skill files |
| GitHub | Use the connected GitHub integration or authorized git workflow available in the session |
| Web research | Use the current search/fetch service and cite retrieved sources |
| Browser/computer interaction | Use only when direct UI interaction is necessary |
| Parallel work | Use collaboration/subagent tools only if the current tool registry exposes them |
| Durable artifacts | Use the supported Library, Drive, or file-delivery workflow after reading its instructions |

## Safe invocation sequence

1. Discover the capability in the live registry.
2. Read its description and schema; verify permissions and required arguments.
3. Establish facts with read-only calls.
4. Perform authorized mutations sequentially, using returned IDs/version tokens.
5. Re-read the resulting state and report observed outcomes.
6. If the tool is unavailable, state that limitation instead of inventing a substitute.
