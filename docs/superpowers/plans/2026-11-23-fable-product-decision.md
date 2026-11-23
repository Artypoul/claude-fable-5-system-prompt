# Fable 5 product decision review plan

Check product decisions, including those proposed by the owner, before plan approval and dependent coding. Check implemented user scenarios after independent code review.

- [ ] Port the approved workflow to the canonical skill and engineering reference. Route coding to GPT-6.2 Sol medium, independent code review to GPT-6.1 Sol xhigh, and product decision review, product acceptance and repeat Fable passes to GPT-6.2 Astra medium. Use isolated contexts and parallelize independently testable write scopes.
- [ ] Update the evaluator and fixtures for those roles. Cover an owner proposal that conflicts with an existing promise, a product decision reopened at acceptance, and an implementation-only defect. Regenerate recorded behavior using the real Codex evaluator.
- [ ] Set both plugin manifests to 1.4.4 and document the release. Preserve the MCP implementation and contracts from 1.4.2.
- [ ] Validate the exact candidate: Python suite, MCP build and tests, installable archive, native gateway probe, and independent review of scope. Open a Ready for review PR against the existing branch whose tree matches MCP 1.4.2. Inspect CI on the new PR head.

A product decision stays with the owner when material choices remain. A reopened decision returns the affected work to product review and the plan. A code defect returns to its original executor with renewed checks of the affected behavior.
