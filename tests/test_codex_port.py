"""Regression checks for the source-based Codex adaptation, not model-behaviour evals."""
import re
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SKILL = Path('.agents/skills/fable5-codex/SKILL.md')
PORT = SKILL.parent / 'references/source-faithful-port.md'


class PortValidationTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        for name in ['.agents', 'scripts', 'system-prompt', 'highlights']:
            shutil.copytree(ROOT / name, self.root / name,
                            ignore=shutil.ignore_patterns('__pycache__'))
        for name in ['CODEX_ADAPTATION_CHANGES.md', 'README.md', 'LICENSE', 'CONTRIBUTING.md']:
            shutil.copy2(ROOT / name, self.root / name)

    def check(self):
        return subprocess.run([sys.executable, str(self.root / 'scripts/verify_codex_skill.py')],
                              cwd=self.root, capture_output=True, text=True, timeout=10)

    def reject(self):
        result = self.check()
        self.assertNotEqual(result.returncode, 0, result.stdout)
        self.assertIn('[FAIL]', result.stdout + result.stderr)

    def change(self, path, old, new):
        file = self.root / path
        text = file.read_text()
        self.assertIn(old, text)
        file.write_text(text.replace(old, new, 1))

    def test_valid_package(self):
        result = self.check()
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_source_body_change_rejected(self):
        self.change(Path('system-prompt/full-system-prompt.md'),
                    'Claude can illustrate explanations', 'Claude must not illustrate explanations')
        self.reject()

    def test_missing_reference_target_rejected(self):
        self.change(SKILL, '(references/code-review.md)', '(references/missing/code-review.md)')
        self.reject()

    def test_empty_reference_body_rejected(self):
        (self.root / SKILL.parent / 'references/code-review.md').write_text('# Deep code review\n')
        self.reject()

    def test_stale_tool_name_in_matrix_rejected(self):
        file = self.root / SKILL.parent / 'references/codex-tool-matrix.md'
        file.write_text(file.read_text() + '\nCall skills.list before every task.\n')
        self.reject()

    def test_duplicate_frontmatter_key_rejected(self):
        self.change(SKILL, 'name: fable5-codex', 'name: fable5-codex\nname: conflicting-name')
        self.reject()

    def test_original_order_is_primary(self):
        text = (self.root / SKILL).read_text()
        headings = re.findall(r'^## (\d+\. .+)$', text, re.M)
        self.assertEqual([h.split(' ', 1)[1] for h in headings], [
            'Codex Behavior', 'Memory System', 'Persistent Storage for Artifacts',
            'MCP App Suggestions', 'Computer Use', 'Search Instructions',
            'Using Image Search', 'Tool Definitions', 'Identity Preamble',
            'AI API in Applications', 'Citation Instructions', 'User Context',
            'Available Skills', 'Network Configuration', 'Filesystem Configuration', 'Thinking Mode'])

    def test_source_faithful_port_exists(self):
        self.assertTrue((self.root / PORT).is_file(), 'The source-based port must be a real runtime reference.')

    def test_source_heading_prose_not_enough_for_coverage(self):
        path = self.root / 'CODEX_ADAPTATION_CHANGES.md'
        text = path.read_text()
        # Keeping all heading labels is insufficient when the decision table is removed.
        start = text.find('## Exhaustive heading-level source coverage')
        if start >= 0:
            end = text.find('## Archived tool inventory mapping', start)
            labels = '\n'.join(re.findall(r'`[^`]+`', text[start:end]))
            path.write_text(text[:start] + labels + '\n' + text[end:])
        else:
            # Final ledger must not accept a mapping row replaced by a prose label.
            path.write_text(re.sub(r'^\| F5-[^\n]+$', '`source heading retained`', text, count=1, flags=re.M))
        self.reject()

    def test_source_tool_schema_change_rejected(self):
        self.change(Path('system-prompt/tool-definitions.md'),
                    '"minItems": 1', '"minItems": 0')
        self.reject()

    def test_target_body_drift_rejected(self):
        self.change(PORT, 'Use only output formats', 'Ignore output formats')
        self.reject()

    def test_missing_rule_anchor_rejected(self):
        self.change(PORT, '<a id="f5-preamble-01"></a>', '')
        self.reject()

    def test_duplicate_ledger_row_rejected(self):
        p = self.root / 'CODEX_ADAPTATION_CHANGES.md'
        text = p.read_text()
        row = re.search(r'^\| F5-preamble-01 \|.*$', text, re.M).group()
        p.write_text(text + '\n' + row + '\n')
        self.reject()

    def test_wrong_source_span_rejected(self):
        self.change(Path('CODEX_ADAPTATION_CHANGES.md'), 'P:90-90', 'P:91-91')
        self.reject()

    def test_broken_reference_fragment_rejected(self):
        self.change(SKILL, '#f5-section-3)', '#missing-section)')
        self.reject()

    def test_package_escape_rejected(self):
        self.change(SKILL, '(references/code-review.md)', '(../../../../LICENSE)')
        self.reject()

    def test_unclosed_code_fence_rejected(self):
        p = self.root / SKILL.parent / 'references/code-review.md'
        p.write_text(p.read_text() + '\n```python\nprint("unfinished")\n')
        self.reject()

    def test_primary_section_reordering_rejected(self):
        p = self.root / SKILL
        text = p.read_text()
        text = text.replace('## 2. Memory System', '## 3. Persistent Storage for Artifacts', 1)
        p.write_text(text)
        self.reject()

    def test_description_length_rejected(self):
        p = self.root / SKILL
        text = p.read_text()
        text = re.sub(r'^description: .+$', 'description: Use when ' + 'x' * 1024,
                      text, count=1, flags=re.M)
        p.write_text(text)
        self.reject()

    def test_validator_works_outside_repository_cwd(self):
        result = subprocess.run([sys.executable, str(self.root / 'scripts/verify_codex_skill.py')],
                                cwd=self.root.parent, capture_output=True, text=True, timeout=10)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_rule_order_rejected(self):
        p = self.root / PORT
        text = p.read_text()
        a = text.index('<a id="f5-1-1-01"></a>')
        b = text.index('<a id="f5-1-1-02"></a>')
        c = text.index('<a id="f5-1-1-03"></a>')
        p.write_text(text[:a] + text[b:c] + text[a:b] + text[c:])
        self.reject()

    def test_secondary_tool_cannot_map_to_unrelated_rule(self):
        p = self.root / 'CODEX_ADAPTATION_CHANGES.md'
        text = p.read_text()
        first = re.search(r'^\| F5-preamble-01 \|.*$', text, re.M).group().split('|')
        row = re.search(r'^\| TD-bash_tool-01 \|.*$', text, re.M).group()
        fields = row.split('|')
        fields[5], fields[6] = first[5], first[6]
        p.write_text(text.replace(row, '|'.join(fields), 1))
        self.reject()

    def test_invalid_plain_yaml_description_rejected(self):
        self.change(SKILL, 'description: Use when ', 'description: Use when mode: ')
        self.reject()

    def test_json_validation_example(self):
        text = (self.root / PORT).read_text()
        example = re.search(r'```python\n(.*?)\n```', text, re.S).group(1)
        namespace = {}
        exec(compile(example, '<documented-example>', 'exec'), namespace)
        parse = namespace['parse_action']
        valid = '{"updatedState": {}, "actionResult": "ok", "availableActions": ["next"]}'
        self.assertEqual(parse(valid)['availableActions'], ['next'])
        for invalid in ['not json', '[]', '{}',
                        '{"updatedState": [], "actionResult": "ok", "availableActions": []}',
                        '{"updatedState": {}, "actionResult": 4, "availableActions": []}',
                        '{"updatedState": {}, "actionResult": "ok", "availableActions": [2]}',
                        '{"updatedState": {}, "actionResult": "ok", "availableActions": [], "extra": 1}']:
            with self.subTest(invalid=invalid), self.assertRaises(ValueError):
                parse(invalid)


if __name__ == '__main__':
    unittest.main()
