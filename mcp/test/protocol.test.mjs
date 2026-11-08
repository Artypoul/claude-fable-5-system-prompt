import assert from "node:assert/strict";
import { test } from "node:test";
import * as fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";

const root = fileURLToPath(new URL("../", import.meta.url));
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function connect(t, script, cwd) {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [script],
    cwd,
    stderr: "pipe",
  });
  let stderr = "";
  transport.stderr.on("data", (data) => {
    stderr += data;
  });
  const client = new Client({ name: "fable5-test", version: "1.0.0" });
  t.after(async () => {
    await client.close();
    assert.equal(stderr, "");
  });
  await client.connect(transport);
  return client;
}

test("actual SDK client discovers schemas, searches and reads through stdio tools/call", async (t) => {
  const cwd = await fs.mkdtemp(path.join(os.tmpdir(), "fable5-sdk-"));
  await fs.writeFile(
    path.join(cwd, "SKILL.md"),
    "---\nname: pdf\ndescription: PDF files\n---\n# PDF instructions",
  );
  const client = await connect(
    t,
    path.join(root, "test/fixtures/server.mjs"),
    cwd,
  );
  t.after(() => fs.rm(cwd, { recursive: true, force: true }));
  const listed = await client.listTools();
  assert.deepEqual(
    listed.tools.map((tool) => tool.name),
    ["search_skills", "read_skill", "fable-status"],
  );
  assert.equal(listed.tools[0].annotations.readOnlyHint, true);
  const search = await client.callTool({
    name: "search_skills",
    arguments: { query: "PDF", cwd },
  });
  assert.equal(search.isError, undefined);
  const found = JSON.parse(search.content[0].text);
  assert.equal(found.total, 1);
  assert.equal(found.skills[0].name, "sample:pdf");
  const read = await client.callTool({
    name: "read_skill",
    arguments: { skill_id: found.skills[0].id, cwd },
  });
  assert.match(JSON.parse(read.content[0].text).content, /# PDF instructions/);
  const invalid = [
    { name: "search_skills", arguments: { query: "PDF", cwd, limit: 0 } },
    { name: "search_skills", arguments: { query: null, cwd } },
    { name: "search_skills", arguments: { query: "PDF", cwd, limit: 1.5 } },
    { name: "search_skills", arguments: { query: "PDF", cwd, offset: -1 } },
    {
      name: "read_skill",
      arguments: { skill_id: found.skills[0].id, cwd, path: "../private.txt" },
    },
    { name: "read_skill", arguments: { skill_id: "0".repeat(64), cwd } },
  ];
  for (const call of invalid)
    assert.equal((await client.callTool(call)).isError, true);
});

test("the distributed bundle starts outside the repository without node_modules", async (t) => {
  const cwd = await fs.mkdtemp(path.join(os.tmpdir(), "fable5-bundle-"));
  t.after(() => fs.rm(cwd, { recursive: true, force: true }));
  const script = path.join(cwd, "server.mjs");
  await fs.copyFile(path.join(root, "dist/server.mjs"), script);
  const client = await connect(t, script, os.tmpdir());
  assert.equal((await client.listTools()).tools.length, 3);
});

test(
  "closing an MCP session aborts and reaps a pending catalogue process",
  { timeout: 10000 },
  async (t) => {
    const cwd = await fs.mkdtemp(path.join(os.tmpdir(), "fable5-cancel-"));
    const client = await connect(
      t,
      path.join(root, "test/fixtures/server.mjs"),
      cwd,
    );
    t.after(() => fs.rm(cwd, { recursive: true, force: true }));
    const pending = client
      .callTool({ name: "search_skills", arguments: { query: "PDF", cwd } })
      .catch((error) => error);
    const pidPath = path.join(cwd, "child.pid");
    let pid;
    for (let attempt = 0; attempt < 50; attempt++) {
      try {
        pid = Number(await fs.readFile(pidPath, "utf8"));
        break;
      } catch {
        await pause(30);
      }
    }
    assert.ok(pid, "catalogue subprocess did not start");
    await client.close();
    await pending;
    let alive = true;
    for (let attempt = 0; attempt < 50; attempt++) {
      try {
        process.kill(pid, 0);
        await pause(30);
      } catch {
        alive = false;
        break;
      }
    }
    if (alive) process.kill(pid);
    assert.equal(
      alive,
      false,
      "catalogue subprocess survived session shutdown",
    );
  },
);
