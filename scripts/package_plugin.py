#!/usr/bin/env python3
"""Build the complete repository as a locally installable Codex plugin ZIP.

The skill remains at its canonical path: no generated copy or rewritten body.
Only explicit repository directories are exported; VCS, caches and user files
outside these paths are never included.
"""
import argparse
import hashlib
import json
import re
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

from verify_codex_skill import ROOT, require, validate

DIRECTORIES = ('.agents', '.codex-plugin', '.github', 'assets', 'highlights',
               'scripts', 'system-prompt', 'tests', 'mcp', 'docs')
FILES = ('.gitignore', '.gitattributes', 'README.md', 'LICENSE', 'CONTRIBUTING.md',
         'CODEX_ADAPTATION_CHANGES.md', 'PLUGIN.md', '.mcp.json', 'MCP.md')


def validate_plugin(root=ROOT):
    result = validate(root)
    manifest = json.loads((root / '.codex-plugin/plugin.json').read_text(encoding='utf-8'))
    require(manifest['name'] == 'fable5-codex', 'unexpected plugin name')
    require(re.fullmatch(r'(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)',
                         manifest['version']) is not None,
            'plugin version must be major.minor.patch')
    require(manifest['skills'] == './.agents/skills/', 'plugin must load the original skill directory')
    require((root / manifest['skills'] / 'fable5-codex/SKILL.md').is_file(), 'skill entry point missing')
    require(manifest.get('mcpServers') == './.mcp.json', 'plugin must declare its MCP configuration')
    mcp = json.loads((root / '.mcp.json').read_text(encoding='utf-8'))
    require(mcp == {'mcpServers': {'fable5_skills': {'command': 'node',
            'args': ['mcp/dist/server.mjs'], 'cwd': './'}}}, 'unexpected MCP launch configuration')
    build_info = json.loads((root / 'mcp/dist/build-info.json').read_text(encoding='utf-8'))
    expected_inputs = {'build.mjs', 'package.json', 'package-lock.json'} | {
        p.relative_to(root / 'mcp').as_posix() for p in (root / 'mcp/src').glob('*.mjs')}
    require(set(build_info['inputs']) == expected_inputs, 'MCP build input inventory differs')
    require(set(build_info['outputs']) == {'dist/server.mjs', 'dist/THIRD_PARTY_LICENSES.txt'},
            'MCP build output inventory differs')
    for name, digest in (build_info['inputs'] | build_info['outputs']).items():
        file = root / 'mcp' / name
        require(file.resolve().is_relative_to((root / 'mcp').resolve()), 'MCP build path escapes package')
        require(hashlib.sha256(file.read_bytes()).hexdigest() == digest,
                f'MCP build is stale or modified: {name}; rerun npm run build in mcp/')
    marketplace = json.loads((root / '.agents/plugins/marketplace.json').read_text(encoding='utf-8'))
    require(marketplace['name'] == 'fable5', 'unexpected marketplace name')
    require(len(marketplace['plugins']) == 1, 'unexpected marketplace entries')
    entry = marketplace['plugins'][0]
    require(entry['name'] == manifest['name'], 'marketplace/plugin identity mismatch')
    require(entry['source'] == {'source': 'local', 'path': './'}, 'marketplace must resolve the package root')
    return result


def build(output, root=ROOT):
    validate_plugin(root)
    paths = [root / name for name in FILES]
    for name in DIRECTORIES:
        paths.extend(p for p in (root / name).rglob('*') if p.is_file()
                     and not {'__pycache__', 'node_modules'}.intersection(p.parts)
                     and p.suffix not in {'.pyc', '.pyo'})
    paths = sorted(paths)
    for path in paths:
        require(path.is_file(), f'missing package input: {path}')
        require(path.resolve().is_relative_to(root.resolve()), f'input escapes package: {path}')
    require(output.resolve() not in [p.resolve() for p in paths], 'output overwrites a package input')
    output.parent.mkdir(parents=True, exist_ok=True)
    with ZipFile(output, 'w', ZIP_DEFLATED) as archive:
        for path in paths:
            archive.write(path, 'fable5-codex/' + path.relative_to(root).as_posix())
    return len(paths)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', required=True, type=Path)
    args = parser.parse_args()
    count = build(args.output)
    print(f'[PASS] Packaged {count} files: {args.output.resolve()}')


if __name__ == '__main__':
    main()
