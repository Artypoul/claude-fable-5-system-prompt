import test from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { Client, InMemoryTransport } from '@modelcontextprotocol/client';
import { createServer } from '../src/server.mjs';
import { fetchConfiguredCatalog, parseCatalog } from '../src/catalog.mjs';
import { diagnosePipeline } from '../src/pipeline-status.mjs';

test('configured candidates are unverified across MCP search, read and status', async t => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'fable-provenance-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const cwd = path.join(root, 'project'), profile = path.join(root, 'profile');
  await fs.mkdir(path.join(cwd, '.codex'), { recursive: true });
  for (const [plugin, names] of [['fable5-codex', ['fable5-codex']], ['superpowers', ['using-superpowers', 'writing-plans']]]) {
    const base = path.join(profile, 'plugins/cache/gigma-skills', plugin, '1.0.0');
    await fs.mkdir(path.join(base, '.codex-plugin'), { recursive: true });
    await fs.writeFile(path.join(base, '.codex-plugin/plugin.json'), JSON.stringify({ name: plugin, skills: './skills' }));
    for (const name of names) {
      const file = path.join(base, 'skills', name, 'SKILL.md');
      await fs.mkdir(path.dirname(file), { recursive: true });
      await fs.writeFile(file, `---\nname: ${name}\ndescription: fixture\n---\n# ${name}\n`);
    }
  }
  await fs.writeFile(path.join(profile, 'config.toml'), '[plugins."fable5-codex@gigma-skills"]\nenabled = true\n[plugins."superpowers@gigma-skills"]\nenabled = true\n');
  await fs.writeFile(path.join(cwd, '.codex/config.toml'), '[plugins."superpowers@gigma-skills"]\nenabled = false\n');
  const server = createServer({ catalogReader: dir => fetchConfiguredCatalog(dir, { profileRoot: profile }) });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: 'provenance-test', version: '1' });
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  t.after(() => client.close());
  const call = async (name, args) => client.callTool({ name, arguments: args });
  const search = (await call('search_skills', { cwd, query: '' })).structuredContent;
  assert.equal(search.catalog_source, 'configured_cache');
  assert.equal(search.native_context_verified, false);
  assert.equal(search.partial, true);
  assert.equal(search.warning_count, 1);
  assert.equal(search.source_warning_count, 0);
  assert.deepEqual(search.warnings, ['NATIVE_CONTEXT_UNVERIFIED']);
  assert.ok(search.skills.every(s => s.enabled_in_native_context === null));
  const read = (await call('read_skill', { cwd, skill_id: search.skills[0].id, limit: 5 })).structuredContent;
  for (const key of ['catalog_source', 'native_context_verified', 'partial', 'warning_count', 'source_warning_count', 'warnings']) assert.deepEqual(read[key], search[key]);
  assert.equal(read.skill.enabled_in_native_context, null);
  const next = (await call('read_skill', { cwd, skill_id: search.skills[0].id, offset: read.next_offset, limit: 5 })).structuredContent;
  for (const key of ['catalog_source', 'native_context_verified', 'partial', 'warning_count', 'source_warning_count', 'warnings']) assert.deepEqual(next[key], search[key]);
  const invalid = await call('search_skills', { cwd, query: '', native_context_verified: true });
  assert.equal(invalid.isError, true);
  await fs.writeFile(path.join(profile, 'config.toml'), '[plugins."fable5-codex@gigma-skills"]\nenabled = false\n[plugins."superpowers@gigma-skills"]\nenabled = false\n');
  const stale = await call('read_skill', { cwd, skill_id: search.skills[0].id });
  assert.equal(stale.isError, true);
  assert.equal(stale.structuredContent.error.code, 'CATALOG_INCOMPLETE');
  const status = await call('fable-status', { cwd });
  assert.equal(status.isError, true);
  assert.equal(status.structuredContent.error.code, 'PIPELINE_INCOMPLETE');
});

test('unverified provenance blocks readiness even if completeness flags are forged', async () => {
  const catalog = { skills: [], catalog_source: 'configured_cache', native_context_verified: false, partial: false, warning_count: 0 };
  await assert.rejects(diagnosePipeline(catalog, process.cwd()), { code: 'PIPELINE_INCOMPLETE' });
  const unknown = parseCatalog({ data: [{ cwd: process.cwd(), skills: [], errors: [] }] }, process.cwd());
  assert.equal(unknown.native_context_verified, false);
  assert.equal(unknown.partial, true);
  for (const catalog_source of [undefined, 'unknown', 'configured_cache', 'native_subprocess']) {
    const candidate = { skills: [], catalog_source, native_context_verified: true, partial: false, warning_count: 0 };
    await assert.rejects(diagnosePipeline(candidate, process.cwd()), { code: 'PIPELINE_INCOMPLETE' });
    const parsed = parseCatalog({ catalog_source, native_context_verified: true, data: [{ cwd: process.cwd(), skills: [], errors: [] }] }, process.cwd());
    assert.equal(parsed.native_context_verified, false);
  }
});

test('only an internally supplied verified native host catalogue can be complete', () => {
  const cwd = process.cwd();
  const payload = { catalog_source: 'native_host', native_context_verified: true, data: [{ cwd, skills: [], errors: [] }] };
  const parsed = parseCatalog(payload, cwd);
  assert.equal(parsed.partial, false);
  assert.equal(parsed.native_context_verified, true);
  assert.equal(parsed.warning_count, 0);
  assert.deepEqual(parsed.warnings, []);
  payload.data[0].errors.push({ message: 'sensitive configuration detail' });
  const errored = parseCatalog(payload, cwd);
  assert.equal(errored.source_warning_count, 1);
  assert.equal(errored.partial, true);
  assert.deepEqual(errored.warnings, ['CATALOG_SOURCE_ERROR']);
});
