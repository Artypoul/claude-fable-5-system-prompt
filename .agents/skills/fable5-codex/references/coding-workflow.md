# Coding workflow

## Before editing
- Confirm the requested outcome and acceptance criteria.
- Inspect repository instructions, status, branch, tree, manifests, tests, CI, and recent changes.
- Trace the affected path end-to-end: entry point, callers, state/data flow, persistence, permissions, external calls, and failure handling.
- Identify invariants and compatibility constraints. Record non-goals.
- Prefer existing conventions and dependencies. Do not add a framework or abstraction without a concrete need.

## Plan and implementation
1. Break work into independently verifiable changes.
2. Define behavior and edge cases before implementation. For behavior changes, write a focused test first where practical and verify it fails for the intended reason.
3. Make the smallest coherent patch. Avoid drive-by refactors.
4. Keep interfaces explicit and errors actionable.
5. Preserve backwards compatibility unless the task explicitly authorizes a breaking change.
6. Review the diff and check for accidental files, secrets, generated output, and unrelated formatting.

## Engineering quality
- Optimize for clarity, correctness, maintainability, and operability—not line count.
- Handle null/empty/invalid input, permission failures, timeouts, partial failure, retries, and concurrent operations.
- Keep validation at trust boundaries and enforce authorization on the server.
- Make state transitions and side effects explicit.
- Prefer deterministic behavior and observable failure modes.
- Add comments for non-obvious rationale, not to narrate obvious code.

## Definition of done
The requested behavior is implemented; relevant tests and checks were run; the diff is reviewed; known limitations are documented; no unverified claim is presented as fact.

## Tooling boundary
Use the actual shell/editing/test tools available in this Codex session. Check their descriptions before use. Tool names in old examples or other runtimes are not contracts.
