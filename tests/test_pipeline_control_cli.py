import json
import subprocess
import sys
import unittest
from pathlib import Path


SCRIPT = Path(__file__).with_name('pipeline_control.py')
SENTINEL = 'sensitive-sentinel-4901'


class PipelineControlCliTests(unittest.TestCase):
    def run_cli(self, data):
        return subprocess.run([sys.executable, '-B', str(SCRIPT)], input=data,
                              text=True, capture_output=True, check=False)

    def test_valid_paths_emit_normalized_json_and_newline(self):
        result = self.run_cli(json.dumps(['a/./b', 'a\\b']))
        self.assertEqual(result.returncode, 0)
        self.assertEqual(result.stdout, '["a/b"]\n')
        self.assertEqual(json.loads(result.stdout), ['a/b'])
        self.assertEqual(result.stderr, '')

    def test_invalid_input_emits_only_one_safe_error_line(self):
        cases = {
            'malformed JSON with sensitive input': '["' + SENTINEL + '",',
            'excessive JSON nesting': '[' * 2000 + '0' + ']' * 2000,
            'object': '{}',
            'number in list': '[1]',
            'escaping path': '["../escape"]',
        }
        for name, data in cases.items():
            with self.subTest(name=name):
                result = self.run_cli(data)
                self.assertEqual(result.returncode, 2)
                self.assertEqual(result.stdout, '')
                self.assertEqual(len(result.stderr.splitlines()), 1)
                self.assertTrue(result.stderr.endswith('\n'))
                self.assertNotIn('Traceback', result.stderr)
                self.assertNotIn(SENTINEL, result.stderr)


if __name__ == '__main__':
    unittest.main()
