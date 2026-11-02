#!/usr/bin/env python3
"""Validate the Codex skill layer without changing the historical archive."""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SKILL = ROOT / ".agents" / "skills" / "fable5-codex" / "SKILL.md"
MATRIX = ROOT / ".agents" / "skills" / "fable5-codex" / "references" / "codex-tool-matrix.md"

REQUIRED_HEADINGS = [
    "## 1. Operating identity",
    "## 2. Task framing and context",
    "## 3. Repository discovery",
    "## 4. Skills and progressive disclosure",
    "## 5. Coding and computer-use workflow",
    "## 6. Search and current information",
    "## 7. Visual and multimodal work",
    "## 8. Tool families",
    "## 9. Product logic and user value",
    "## 10. Documentation and marketing",
    "## 11. External APIs and connectors",
    "## 12. Citations and evidence",
    "## 13. Files, artifacts, and persistence",
    "## 14. Safety, privacy, and refusal handling",
    "## 15. Verification and failure handling",
    "## 16. GitHub handoff",
]

FORBIDDEN_RUNTIME_MARKERS = [
    "/home/claude",
    "/mnt/user-data",
    "api.anthropic.com",
    "claude-sonnet-",
    "<invoke",
    "<cite index=",
]

def fail(message: str) -> None:
    raise SystemExit(f"[FAIL] {message}")

def main() -> int:
    if not SKILL.is_file():
        fail(f"missing {SKILL.relative_to(ROOT)}")
    if not MATRIX.is_file():
        fail(f"missing {MATRIX.relative_to(ROOT)}")

    content = SKILL.read_text(encoding="utf-8")
    if not content.startswith("---\n"):
        fail("SKILL.md must start with YAML front matter")

    front_matter = content.split("---\n", 2)
    if len(front_matter) < 3:
        fail("SKILL.md front matter is not closed")
    header = front_matter[1]
    if not re.search(r"(?m)^name:\s*\S+", header):
        fail("front matter is missing name")
    if not re.search(r"(?m)^description:\s*.+", header):
        fail("front matter is missing description")

    for heading in REQUIRED_HEADINGS:
        if heading not in content:
            fail(f"missing required heading: {heading}")

    if "references/codex-tool-matrix.md" not in content:
        fail("SKILL.md does not link to its tool matrix")

    for marker in FORBIDDEN_RUNTIME_MARKERS:
        if marker in content:
            fail(f"Codex skill contains forbidden legacy runtime marker: {marker}")

    print("[PASS] Codex skill structure and runtime-neutrality checks passed.")
    print(f"[PASS] Checked {len(REQUIRED_HEADINGS)} required sections and the tool matrix.")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
