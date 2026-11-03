import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/client";
import {
  StdioClientTransport,
  getDefaultEnvironment,
} from "@modelcontextprotocol/client/stdio";

const project = process.argv[2];
if (!project || !path.isAbsolute(project))
  throw new Error("Usage: npm run smoke -- /absolute/project/path");
const root = path.dirname(fileURLToPath(import.meta.url));
const script = process.argv[3] || path.join(root, "dist/server.mjs");
const env = getDefaultEnvironment();
if (process.env.FABLE5_CODEX_BIN)
  env.FABLE5_CODEX_BIN = process.env.FABLE5_CODEX_BIN;
const transport = new StdioClientTransport({
  command: process.execPath,
  args: [script],
  cwd: project,
  env,
  stderr: "pipe",
});
const client = new Client({ name: "fable5-live-smoke", version: "1.0.0" });
transport.stderr.on("data", () => {});
const unpack = (response) => {
  const value = JSON.parse(response.content[0].text);
  if (response.isError) throw new Error(JSON.stringify(value));
  return value;
};
try {
  await client.connect(transport);
  const { tools } = await client.listTools();
  assert.deepEqual(
    tools.map((tool) => tool.name),
    ["search_skills", "read_skill"],
  );
  const search = unpack(
    await client.callTool({
      name: "search_skills",
      arguments: { query: "fable5-codex", cwd: project },
    }),
  );
  const skill =
    search.skills.find((item) => item.plugin_id === "fable5-codex@fable5") ||
    search.skills[0];
  assert.ok(
    skill,
    "Fable 5 must be installed or present in the project catalogue",
  );
  const read = unpack(
    await client.callTool({
      name: "read_skill",
      arguments: { cwd: project, skill_id: skill.id },
    }),
  );
  assert.match(read.content, /name: fable5-codex/);
  assert.match(read.sha256, /^[a-f0-9]{64}$/);
  console.log(
    JSON.stringify(
      {
        status: "pass",
        source: "live Codex skills/list",
        tools: tools.map((t) => t.name),
        skill: skill.name,
        scope: skill.scope,
        plugin_id: skill.plugin_id,
        matches: search.total,
        partial: search.partial,
        content_sha256: read.sha256,
      },
      null,
      2,
    ),
  );
} finally {
  await client.close();
}
