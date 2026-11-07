import json
import os
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

    def test_utf8_input_is_independent_of_stdin_locale(self):
        env = {**os.environ, 'PYTHONUTF8': '0', 'PYTHONIOENCODING': 'cp1252'}
        result = subprocess.run([sys.executable, '-B', str(SCRIPT)],
                                input=b'["caf\xc3\xa9"]', capture_output=True,
                                env=env, check=False)
        self.assertEqual(result.returncode, 0)
        self.assertEqual(json.loads(result.stdout), ['café'])
        self.assertTrue(result.stdout.endswith(b'\n'))
        self.assertEqual(result.stderr, b'')

    def test_invalid_utf8_bytes_are_rejected_without_echo(self):
        env = {**os.environ, 'PYTHONUTF8': '0',
               'PYTHONIOENCODING': 'utf-8:surrogateescape'}
        for data in (b'["secret-\xff"]', b'["secret-\xed\xb3\xbf"]'):
            with self.subTest(data=data):
                result = subprocess.run([sys.executable, '-B', str(SCRIPT)],
                                        input=data, capture_output=True,
                                        env=env, check=False)
                self.assertEqual(result.returncode, 2)
                self.assertEqual(result.stdout, b'')
                self.assertEqual(result.stderr.splitlines(), [b'Invalid input'])
                self.assertEqual(len(result.stderr.splitlines()), 1)
                self.assertTrue(result.stderr.endswith(b'\n'))
                self.assertNotIn(b'Traceback', result.stderr)
                self.assertNotIn(b'secret', result.stderr)

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
