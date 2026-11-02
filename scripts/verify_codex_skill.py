#!/usr/bin/env python3
"""Validate the Codex-native skill package and its source coverage map."""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SKILL_ROOT = ROOT / ".agents" / "skills" / "fable5-codex"
SKILL = SKILL_ROOT / "SKILL.md"
MATRIX = SKILL_ROOT / "references" / "codex-tool-matrix.md"
CHANGELOG = ROOT / "CODEX_ADAPTATION_CHANGES.md"

REQUIRED_HEADINGS = [
    "## 1. Operating identity and behavior",
    "## 2. Task framing, context, and memory",
    "## 3. Repository discovery and instruction hierarchy",
    "## 4. Skills and progressive disclosure",
    "## 5. Coding, debugging, and computer-use workflow",
    "## 6. Search and current information",
    "## 7. Visual, multimodal, and browser work",
    "## 8. Tools, MCP, and external integrations",
    "## 9. Product logic and user value",
    "## 10. Documentation, communication, and marketing",
    "## 11. External APIs, connectors, and side effects",
    "## 12. Citations, evidence, and intellectual property",
    "## 13. Files, artifacts, and persistence",
    "## 14. Safety, privacy, wellbeing, and refusal handling",
    "## 15. Verification, testing, and failure handling",
    "## 16. GitHub handoff and delivery",
]

REQUIRED_REFERENCES = [
    "coding-workflow.md",
    "debugging.md",
    "code-review.md",
    "testing-and-ci.md",
    "product-engineering.md",
    "research-and-citations.md",
    "tools-and-mcp.md",
    "safety-and-privacy.md",
    "files-and-artifacts.md",
    "communication-and-marketing.md",
    "codex-tool-matrix.md",
]

FORBIDDEN_RUNTIME_MARKERS = [
    "/home/claude",
    "/mnt/user-data",
    "api.anthropic.com",
    "claude-sonnet-",
    "<invoke",
    "<cite index=",
    "window.storage",
    "bash_tool",
    "str_replace",
    "present_files",
    "search_mcp_registry",
    "suggest_connectors",
]

SOURCE_COVERAGE_MARKERS = [
    "Preamble: voice-note restriction",
    "1.1 Product information",
    "1.2 Refusal handling",
    "1.3 Legal and financial advice",
    "1.4 Tone and formatting",
    "1.4.1 Lists and bullets",
    "1.5 User wellbeing",
    "1.6 Provider runtime reminders",
    "1.7 Evenhandedness",
    "1.8 Mistakes and criticism",
    "1.9 Knowledge cutoff",
    "2. Memory system",
    "3. Persistent artifact storage",
    "4. MCP app suggestions",
    "5.1 Skills",
    "5.2 File creation advice",
    "5.3 Computer-use environment",
    "5.4 File handling",
    "5.5 Producing outputs",
    "5.6 Sharing files",
    "5.7 Artifact usage criteria",
    "5.8 Package management",
    "5.9 Examples",
    "5.10 Additional skill reminder",
    "6.1 Core search behaviors",
    "6.2 Search usage",
    "6.3 Copyright compliance",
    "6.4 Search examples",
    "6.5 Harmful-content search",
    "6.6 Critical reminders",
    "7. Image search",
    "8. Tool definitions",
    "9. Identity preamble",
    "10. Provider API inside artifacts",
    "11. Citation instructions",
    "12. User context injection",
    "13. Available skills catalogue",
    "14. Network configuration",
    "15. Filesystem configuration",
    "16. Thinking mode",
]

def fail(message: str) -> None:
    raise SystemExit(f"[FAIL] {message}")

def main() -> int:
    for path in (SKILL, MATRIX, CHANGELOG):
        if not path.is_file():
            fail(f"missing required file: {path.relative_to(ROOT)}")

    content = SKILL.read_text(encoding="utf-8")
    if not content.startswith("---\n"):
        fail("SKILL.md must start with YAML front matter")
    front_matter = content.split("---\n", 2)
    if len(front_matter) < 3:
        fail("SKILL.md front matter is not closed")
    header = front_matter[1]
    name = re.search(r"(?m)^name:\s*([a-z0-9-]+)\s*$", header)
    description = re.search(r"(?m)^description:\s*(.+)$", header)
    if not name or name.group(1) != SKILL_ROOT.name:
        fail("front matter name must match the skill directory")
    if not description or not description.group(1).startswith("Use when "):
        fail("description must start with 'Use when' and describe triggers")
    if len(header) > 1024:
        fail("front matter exceeds the Agent Skills metadata size budget")
    if len(content.splitlines()) > 500:
        fail("main SKILL.md exceeds 500 lines; move detail into references")

    for heading in REQUIRED_HEADINGS:
        if heading not in content:
            fail(f"missing required section: {heading}")

    changelog = CHANGELOG.read_text(encoding="utf-8")
    for marker in SOURCE_COVERAGE_MARKERS:
        if marker.lower() not in changelog.lower():
            fail(f"source section missing from adaptation coverage map: {marker}")

    for reference in REQUIRED_REFERENCES:
        path = SKILL_ROOT / "references" / reference
        if not path.is_file():
            fail(f"missing reference: {path.relative_to(ROOT)}")
        if reference not in content and reference != "codex-tool-matrix.md":
            fail(f"main skill does not link to reference: {reference}")

    # Executable skill guidance must not depend on archived provider runtime details.
    executable_docs = [SKILL] + [
        path for path in (SKILL_ROOT / "references").glob("*.md")
        if path.name != "codex-tool-matrix.md"
    ]
    for path in executable_docs:
        text = path.read_text(encoding="utf-8").lower()
        for marker in FORBIDDEN_RUNTIME_MARKERS:
            if marker.lower() in text:
                fail(f"{path.relative_to(ROOT)} contains legacy runtime marker: {marker}")

    matrix = MATRIX.read_text(encoding="utf-8")
    if "not an API reference" not in matrix:
        fail("tool matrix must state that it is capability guidance, not a fixed API")
    if "live registry" not in matrix.lower():
        fail("tool matrix must require live capability discovery")

    print("[PASS] Codex skill front matter and package structure.")
    print(f"[PASS] {len(REQUIRED_HEADINGS)} required sections.")
    print(f"[PASS] {len(REQUIRED_REFERENCES)} linked references.")
    print(f"[PASS] {len(SOURCE_COVERAGE_MARKERS)} archived source sections mapped.")
    print("[PASS] No forbidden legacy runtime markers in executable skill guidance.")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
