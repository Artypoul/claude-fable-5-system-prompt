#!/usr/bin/env python3
"""Validate the Codex-native skill package and its coverage of the archived source."""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SKILL_ROOT = ROOT / ".agents" / "skills" / "fable5-codex"
SKILL = SKILL_ROOT / "SKILL.md"
REFERENCES = SKILL_ROOT / "references"
MATRIX = REFERENCES / "codex-tool-matrix.md"
CHANGELOG = ROOT / "CODEX_ADAPTATION_CHANGES.md"
SOURCE = ROOT / "system-prompt" / "full-system-prompt.md"

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
    "context-memory-and-persistence.md",
    "mcp-consent-and-connectors.md",
    "search-policy.md",
    "visual-and-artifact-workflows.md",
]

ARCHIVED_TOOL_MARKERS = [
    "ask_user_input_v0", "bash_tool", "create_file", "fetch_sports_data",
    "image_search", "message_compose_v1", "places_map_display_v0", "places_search",
    "present_files", "recipe_display_v0", "recommend_claude_apps",
    "search_mcp_registry", "str_replace", "suggest_connectors", "view",
    "weather_fetch", "web_fetch", "web_search",
]

LEGACY_RUNTIME_MARKERS = [
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

def fail(message: str) -> None:
    raise SystemExit(f"[FAIL] {message}")

def main() -> int:
    for path in (SKILL, MATRIX, CHANGELOG, SOURCE):
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
    source = SOURCE.read_text(encoding="utf-8")
    source_headings = [
        match.group(1).strip()
        for match in re.finditer(r"(?m)^#{2,4}\s+(.+?)\s*$", source)
        if match.group(1).strip() != "Table of Contents"
    ]
    for heading in source_headings:
        if f"`{heading}`" not in changelog:
            fail(f"source heading missing from exhaustive coverage map: {heading}")

    for tool_name in ARCHIVED_TOOL_MARKERS:
        if tool_name not in changelog:
            fail(f"archived tool missing from source mapping: {tool_name}")

    for reference in REQUIRED_REFERENCES:
        path = REFERENCES / reference
        if not path.is_file():
            fail(f"missing reference: {path.relative_to(ROOT)}")
        if reference not in content:
            fail(f"main skill does not link to reference: {reference}")

    executable_docs = [SKILL] + [
        path for path in REFERENCES.glob("*.md")
        if path.name != "codex-tool-matrix.md"
    ]
    for path in executable_docs:
        text = path.read_text(encoding="utf-8").lower()
        for marker in LEGACY_RUNTIME_MARKERS:
            if marker.lower() in text:
                fail(f"{path.relative_to(ROOT)} contains legacy runtime marker: {marker}")

    matrix = MATRIX.read_text(encoding="utf-8")
    if "not an API reference" not in matrix:
        fail("tool matrix must state that it is capability guidance, not a fixed API")
    if "live registry" not in matrix.lower():
        fail("tool matrix must require live capability discovery")

    print("[PASS] Codex skill front matter and package structure.")
    print(f"[PASS] {len(REQUIRED_HEADINGS)} required skill sections.")
    print(f"[PASS] {len(REQUIRED_REFERENCES)} required and linked references.")
    print(f"[PASS] {len(source_headings)} exact source headings mapped.")
    print(f"[PASS] {len(ARCHIVED_TOOL_MARKERS)} archived tools mapped.")
    print("[PASS] No forbidden legacy runtime markers in executable guidance.")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
