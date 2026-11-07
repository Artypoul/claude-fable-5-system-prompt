import unittest

from pipeline_control import normalize_paths


class NormalizePathsTests(unittest.TestCase):
    def test_normalizes_and_deduplicates_in_stable_case_sensitive_order(self):
        self.assertEqual(normalize_paths(['a/./b', 'a\\b', 'A/b', 'x/y/../z']),
                         ['a/b', 'A/b', 'x/z'])

    def test_empty_list_is_valid(self):
        self.assertEqual(normalize_paths([]), [])

    def test_preserves_meaningful_spaces(self):
        self.assertEqual(normalize_paths([' a /b ']), [' a /b '])

    def test_removes_repeated_separators_and_dot_segments(self):
        self.assertEqual(normalize_paths(['./one//two\\.\\three/']), ['one/two/three'])

    def test_does_not_fold_unicode_or_case(self):
        self.assertEqual(normalize_paths(['é', 'e\u0301', 'A', 'a']), ['é', 'e\u0301', 'A', 'a'])

    def test_rejects_invalid_inputs(self):
        cases = [
            None, 'a', ('a',), [1], [''], [' \t'], ['a\x00b'],
            ['/a'], ['\\a'], ['\\\\server\\share'], ['C:'], ['c:relative'],
            ['../a'], ['a/../../b'], ['.'], ['a/..'], ['a//./..'],
            ['./C:foo'], ['a/../C:/x'], ['good', ''],
        ]
        for value in cases:
            with self.subTest(value=value):
                with self.assertRaises(ValueError):
                    normalize_paths(value)


if __name__ == '__main__':
    unittest.main()
