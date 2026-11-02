#!/usr/bin/env python3
"""Check this skill's source integrity, structure, links and body-level traceability.

This is a deterministic regression check, not a semantic-equivalence or agent eval.
The accepted front matter is deliberately this package's two plain scalar fields,
not arbitrary YAML. Source blob pins identify a repository revision, not authenticity.
"""
from __future__ import annotations

import hashlib
import re
import sys
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
PACKAGE = ROOT / '.agents/skills/fable5-codex'
PORT = PACKAGE / 'references/source-faithful-port.md'
PROTECTED = {
    'CONTRIBUTING.md': '0a995929f3c7f46d18ae9ee10793bad4bdf8b038',
    'LICENSE': 'a0048bacb2b27d1be22f16df484019f31a125afb',
    'highlights/surprising-revelations.md': '6d8a056426aed5e575744040aaada2c5ca4419a1',
    'scripts/verify_signatures.py': '9b6806e89f9a351b98a102fbf8a99b5ef7987919',
    'system-prompt/analysis/behavioral-guidelines.md': '7f1f32f953934a821389d9588e6625057f05d4bd',
    'system-prompt/analysis/fable5-vs-opus-comparison.md': '51c80a7043c3c6571247a2518f37cd7130ce229b',
    'system-prompt/analysis/key-findings.md': 'b0205b1640980250d80fe70bcd41bb97d257dca3',
    'system-prompt/analysis/model-architecture.md': '93fc5fe4adae294af6b8a589300a4998f8eb66a2',
    'system-prompt/full-system-prompt.md': 'e58d590021213328378926f36c43c42d84d4792b',
    'system-prompt/tool-definitions.md': '7f36ad3182187d0f8ae648123b5ce49bb526ca0a',
}
TITLES = [
    'Codex Behavior', 'Memory System', 'Persistent Storage for Artifacts',
    'MCP App Suggestions', 'Computer Use', 'Search Instructions', 'Using Image Search',
    'Tool Definitions', 'Identity Preamble', 'AI API in Applications',
    'Citation Instructions', 'User Context', 'Available Skills',
    'Network Configuration', 'Filesystem Configuration', 'Thinking Mode',
]
REASONS = {'identity', 'runtime', 'policy', 'format', 'current', 'storage',
           'consent', 'files', 'api', 'schema', 'preserve', 'attribution'}
# Known regressions, not a claim to detect every possible invented API. Historical
# tool names in provenance tables are allowed; none becomes a callable contract.
LEGACY = ['/home/claude', '/mnt/user-data', '/mnt/skills/', 'api.anthropic.com',
          'claude-sonnet-', '<invoke', '<cite index=', 'window.storage',
          'skills.list', 'skills__list', 'mcp__codex_apps__search_service_web_run',
          'functions.exec', '\ue200genui']


def require(condition: bool, message: str) -> None:
    if not condition:
        raise ValueError(message)


def visible_lines(text: str) -> list[str]:
    """Blank fenced code while retaining line numbers; reject unclosed fences."""
    result = []
    fence = None
    for line in text.splitlines():
        match = re.match(r'^\s{0,3}(`{3,}|~{3,})', line)
        if match:
            tag = match.group(1)
            if fence is None:
                fence = tag
            elif tag[0] == fence[0] and len(tag) >= len(fence):
                fence = None
            result.append('')
        else:
            result.append(line if fence is None else '')
    require(fence is None, 'unclosed Markdown code fence')
    return result


def sections(text: str) -> list[dict]:
    lines = text.splitlines(keepends=True)
    result = []
    for i, line in enumerate(visible_lines(text)):
        match = re.match(r'^(#{2,4})\s+(.+?)\s*$', line)
        if not match:
            continue
        if result:
            result[-1]['end'] = i
        title = match.group(2)
        number = re.match(r'(\d+(?:\.\d+)*)(?:\.\s|\s)', title)
        result.append({'title': title, 'level': len(match.group(1)), 'start': i + 1,
                       'number': number.group(1) if number else (
                           'preamble' if title.startswith('Preamble:') else title)})
    if result:
        result[-1]['end'] = len(lines)
    for section in result:
        section['body'] = ''.join(lines[section['start']:section['end']])
    return result


def blocks(section: dict) -> list[tuple[int, int]]:
    """Source paragraphs, list entries and fenced examples, in original order."""
    result = []
    start = None
    last = None
    fence = None

    def flush() -> None:
        nonlocal start
        if start is not None:
            result.append((section['start'] + 1 + start, section['start'] + 1 + last))
            start = None

    for i, line in enumerate(section['body'].splitlines()):
        match = re.match(r'^(`{3,}|~{3,})', line)
        if fence:
            last = i
            if match and match.group(1)[0] == fence[0] and len(match.group(1)) >= len(fence):
                fence = None
                flush()
            continue
        if match:
            flush()
            start = last = i
            fence = match.group(1)
            continue
        if not line.strip() or line.strip() == '---' or re.match(r'^<a id=', line) or line.startswith('<!--'):
            flush()
            continue
        if re.match(r'^[-*] |^\d+\. |^> |^\*\*await ', line):
            flush()
        if start is None:
            start = i
        last = i
    flush()
    return result


def anchors(text: str) -> set[str]:
    visible = '\n'.join(visible_lines(text))
    explicit = re.findall(r'<a id="([^"]+)"></a>', visible)
    require(len(explicit) == len(set(explicit)), 'duplicate explicit Markdown anchor')
    result = set(explicit)
    seen = {}
    for heading in re.findall(r'^#{1,6}\s+(.+)$', visible, re.M):
        slug = re.sub(r'[^\w\- ]', '', heading.lower()).replace(' ', '-')
        count = seen.get(slug, 0)
        seen[slug] = count + 1
        result.add(slug if count == 0 else f'{slug}-{count}')
    return result


def validate(root: Path = ROOT) -> dict[str, int]:
    package = root / '.agents/skills/fable5-codex'
    port_path = package / 'references/source-faithful-port.md'
    for relative, expected in PROTECTED.items():
        data = (root / relative).read_bytes()
        actual = hashlib.sha1(f'blob {len(data)}\0'.encode() + data).hexdigest()
        require(actual == expected, f'original archive changed: {relative}')

    skill = (package / 'SKILL.md').read_text(encoding='utf-8')
    lines = skill.splitlines()
    require(lines and lines[0] == '---', 'missing YAML front matter')
    require('---' in lines[1:], 'unclosed YAML front matter')
    end = lines.index('---', 1)
    fields = {}
    for line in lines[1:end]:
        match = re.fullmatch(r'(name|description): ([^\r\n]+)', line)
        require(match is not None, 'front matter requires plain name/description scalar fields')
        key, value = match.groups()
        require(key not in fields, f'duplicate front-matter key: {key}')
        require(': ' not in value and ' #' not in value and value[0] not in '\"\'[{>|&*!',
                f'unsupported plain scalar in front matter: {key}')
        fields[key] = value
    require(set(fields) == {'name', 'description'}, 'missing required front-matter fields')
    require(fields['name'] == package.name and len(fields['name']) <= 64,
            'name must match the skill directory and be at most 64 characters')
    require(1 <= len(fields['description']) <= 1024 and fields['description'].startswith('Use when '),
            'description must be a 1–1024 character trigger starting with Use when')
    require(len(lines) <= 500, 'entry point exceeds this package\'s 500-line budget')
    main_headings = re.findall(r'^## (\d+\. .+)$', skill, re.M)
    require(main_headings == [f'{i}. {t}' for i, t in enumerate(TITLES, 1)],
            'main skill must retain the original sixteen-section order')

    documents = {p.resolve(): p.read_text(encoding='utf-8') for p in package.rglob('*.md')}
    require(port_path.resolve() in documents, 'missing canonical source-based port')
    for path, text in documents.items():
        visible = '\n'.join(visible_lines(text))
        body = re.sub(r'<[^>]+>|^#{1,6}.*$|^\s*[-|: ]+$', '', visible, flags=re.M)
        require(len(re.findall(r'\b\w+\b', body)) >= 15,
                f'empty or heading-only reference: {path.name}')
        for marker in LEGACY:
            require(marker.lower() not in text.lower(), f'legacy runtime regression in {path.name}: {marker}')
        for target in re.findall(r'\]\(([^\s)]+)\)', visible):
            parts = urlsplit(target)
            if parts.scheme in {'http', 'https', 'mailto'}:
                continue
            require(not parts.scheme and not parts.netloc and not parts.query,
                    f'unsupported local link: {path.name}: {target}')
            destination = (path.parent / unquote(parts.path)).resolve() if parts.path else path
            require(destination.is_relative_to(package.resolve()), f'link escapes skill package: {target}')
            require(destination in documents, f'broken local file link: {path.name}: {target}')
            if parts.fragment:
                require(unquote(parts.fragment) in anchors(documents[destination]),
                        f'broken local anchor: {path.name}: {target}')
    direct_refs = {urlsplit(x).path for x in re.findall(r'\]\(([^\s)]+)\)', skill)}
    for path in (package / 'references').glob('*.md'):
        require(f'references/{path.name}' in direct_refs, f'unlinked reference: {path.name}')

    source = (root / 'system-prompt/full-system-prompt.md').read_text(encoding='utf-8')
    primary_sections = [s for s in sections(source) if s['title'] != 'Table of Contents']
    port = documents[port_path.resolve()]
    port_sections = sections(port)
    require([(s['level'], s['number']) for s in primary_sections] ==
            [(s['level'], s['number']) for s in port_sections],
            'canonical port section order/levels do not match the original')
    canonical = {}
    positions = list(re.finditer(r'^<a id="([^"]+)"></a>\s*$', port, re.M))
    for index, match in enumerate(positions):
        end = positions[index + 1].start() if index + 1 < len(positions) else len(port)
        key = match.group(1)
        require(key not in canonical, f'duplicate target anchor: {key}')
        canonical[key] = port[match.end():end].strip()

    expected = {}
    for section in primary_sections:
        for i, (start, end) in enumerate(blocks(section), 1):
            key = f'F5-{section["number"]}-{i:02}'
            expected[key] = (f'P:{start}-{end}', key.lower().replace('.', '-'))
    ordered_primary = [value[1] for value in expected.values()]
    ordered_actual = [key for key in canonical if not key.startswith('f5-section-')]
    require(ordered_actual == ordered_primary, 'canonical rule order differs from the source')
    tool_map = {s['title'].split(' ', 1)[1]: s for s in primary_sections
                if s['number'].startswith('8.')}
    secondary = (root / 'system-prompt/tool-definitions.md').read_text(encoding='utf-8')
    secondary_lines = secondary.splitlines()
    for section in sections(secondary):
        for i, (start, end) in enumerate(blocks(section), 1):
            key = f'TD-{section["title"].replace(" ", "-")}-{i:02}'
            raw = '\n'.join(secondary_lines[start - 1:end])
            if section['title'] == 'Tool Summary':
                target = 'f5-8-04'
            elif (raw.startswith(('<div', '</div')) or '[← Back to README]' in raw
                  or 'Archived and maintained' in raw):
                target = 'f5-16-02'
            else:
                source_tool = tool_map[section['title']]
                number = source_tool['number']
                if raw.startswith('```json') or raw == '**Schema:**':
                    index = len(blocks(source_tool))
                else:
                    index = 2 if number in {'8.7', '8.8'} else 1
                target = f'f5-{number.replace(".", "-")}-{index:02}'
            expected[key] = (f'D:{start}-{end}', target)
    rows = {}
    changelog = (root / 'CODEX_ADAPTATION_CHANGES.md').read_text(encoding='utf-8')
    for line in changelog.splitlines():
        if not re.match(r'^\| (?:F5-|TD-)', line):
            continue
        values = [x.strip() for x in line.strip('|').split('|')]
        require(len(values) == 6, 'invalid traceability row')
        key, span, decision, reason, target, digest = values
        require(key not in rows, f'duplicate source decision: {key}')
        require(key in expected, f'unknown source decision: {key}')
        require(span == expected[key][0], f'incorrect source span: {key}')
        require(decision in {'preserve', 'adapt', 'replace'} and reason in REASONS,
                f'invalid decision/reason: {key}')
        if expected[key][1] is not None:
            require(target == expected[key][1], f'source block routed to wrong anchor: {key}')
        require(target in canonical and not target.startswith('f5-section-'), f'missing rule body: {target}')
        body = canonical[target]
        require(bool(re.search(r'[A-Za-z]', body)), f'empty rule body: {target}')
        require(hashlib.sha256(body.encode()).hexdigest() == digest, f'target body drift: {key}')
        rows[key] = target
    require(set(rows) == set(expected), f'missing source decisions: {sorted(set(expected) - set(rows))}')
    body_anchors = {x for x in canonical if not x.startswith('f5-section-')}
    primary_anchors = set(ordered_primary)
    require(body_anchors == primary_anchors, 'unmapped or missing canonical body blocks')
    tool_sections = [s for s in primary_sections if s['number'].startswith('8.')]
    require(len(tool_sections) == 18, 'archived tool inventory mismatch')
    return {'protected_files': len(PROTECTED), 'source_headings': len(primary_sections),
            'source_blocks': len(expected), 'canonical_blocks': len(primary_anchors),
            'references': len(documents) - 1, 'tool_families': len(tool_sections)}


def main() -> int:
    try:
        result = validate()
    except (ValueError, OSError, UnicodeError) as error:
        print(f'[FAIL] {error}', file=sys.stderr)
        return 1
    for name, count in result.items():
        print(f'[PASS] {name}: {count}')
    print('[PASS] Metadata, ordered structure, local links and body fingerprints.')
    print('[NOTE] Traceability checks detect drift; they do not prove semantic equivalence or agent behaviour.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
