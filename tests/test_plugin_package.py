"""Exercise the distributable ZIP and its install-time skill contract."""
import json
import sys
import tempfile
import unittest
from pathlib import Path
from zipfile import ZipFile

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from package_plugin import build, validate_plugin


class PluginPackageTests(unittest.TestCase):
    def test_new_release_version_can_be_packaged(self):
        with tempfile.TemporaryDirectory() as temp:
            work = Path(temp)
            output = work / 'plugin.zip'
            build(output)
            with ZipFile(output) as archive:
                archive.extractall(work / 'unpacked')
            extracted = work / 'unpacked/fable5-codex'
            path = extracted / '.codex-plugin/plugin.json'
            manifest = json.loads(path.read_text(encoding='utf-8'))
            major, minor, patch = map(int, manifest['version'].split('.'))
            manifest['version'] = f'{major}.{minor}.{patch + 1}'
            path.write_text(json.dumps(manifest), encoding='utf-8')
            build(work / 'next-release.zip', root=extracted)
            manifest['version'] = 'not-a-version'
            path.write_text(json.dumps(manifest), encoding='utf-8')
            with self.assertRaisesRegex(ValueError, 'version'):
                build(work / 'invalid-release.zip', root=extracted)

    def test_archive_preserves_runtime_and_validation(self):
        with tempfile.TemporaryDirectory() as temp:
            work = Path(temp)
            output = work / 'plugin.zip'
            count = build(output)
            with ZipFile(output) as archive:
                self.assertEqual(count, len(archive.namelist()))
                self.assertFalse(any('/.git/' in n or '__pycache__' in n for n in archive.namelist()))
                archive.extractall(work / 'unpacked')
            installed = work / 'unpacked/fable5-codex'
            validate_plugin(installed)
            source_skill = ROOT / '.agents/skills/fable5-codex'
            installed_skill = installed / '.agents/skills/fable5-codex'
            expected = {p.relative_to(source_skill): p.read_bytes() for p in source_skill.rglob('*') if p.is_file()}
            actual = {p.relative_to(installed_skill): p.read_bytes() for p in installed_skill.rglob('*') if p.is_file()}
            self.assertEqual(expected, actual)
            self.assertTrue((installed / 'system-prompt/tool-definitions.md').is_file())
            self.assertTrue((installed / 'CODEX_ADAPTATION_CHANGES.md').is_file())
            manifest = json.loads((installed / '.codex-plugin/plugin.json').read_text())
            self.assertEqual(installed_skill.parent, (installed / manifest['skills']).resolve())
            self.assertTrue((installed / '.mcp.json').is_file())
            self.assertTrue((installed / 'mcp/dist/server.mjs').is_file())
            self.assertTrue((installed / 'mcp/dist/update.mjs').is_file())
            self.assertTrue((installed / 'mcp/dist/THIRD_PARTY_LICENSES.txt').is_file())
            self.assertFalse((installed / 'mcp/node_modules').exists())

    def test_stale_mcp_bundle_is_rejected(self):
        with tempfile.TemporaryDirectory() as temp:
            work = Path(temp)
            build(work / 'plugin.zip')
            with ZipFile(work / 'plugin.zip') as archive:
                archive.extractall(work / 'unpacked')
            installed = work / 'unpacked/fable5-codex'
            source = installed / 'mcp/src/search.mjs'
            source.write_bytes(source.read_bytes() + b'\n// unbuilt change\n')
            with self.assertRaisesRegex(ValueError, 'MCP build is stale'):
                validate_plugin(installed)

    def test_mcp_launch_and_bundle_tampering_are_rejected(self):
        with tempfile.TemporaryDirectory() as temp:
            work = Path(temp)
            build(work / 'plugin.zip')
            with ZipFile(work / 'plugin.zip') as archive:
                archive.extractall(work / 'unpacked')
            installed = work / 'unpacked/fable5-codex'
            config = installed / '.mcp.json'
            original = config.read_bytes()
            data = json.loads(original)
            data['mcpServers']['fable5_skills']['args'] = ['../unregistered-server.mjs']
            config.write_text(json.dumps(data), encoding='utf-8')
            with self.assertRaisesRegex(ValueError, 'MCP launch configuration'):
                validate_plugin(installed)
            config.write_bytes(original)
            bundle = installed / 'mcp/dist/server.mjs'
            bundle.write_bytes(bundle.read_bytes() + b'\n// modified artifact\n')
            with self.assertRaisesRegex(ValueError, 'MCP build is stale'):
                validate_plugin(installed)


if __name__ == '__main__':
    unittest.main()
