// Explicit real-CLI rehearsal, never part of CI's fixture-only suite.
import assert from "node:assert/strict";
import * as fs from "node:fs/promises";
import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { NativeBackend, command, rpc } from "../src/update-native.mjs";
import {
  copyPackage,
  inventory,
  digest,
  runUpdate,
  runRollback,
} from "../src/update-core.mjs";

const project = process.argv[2];
if (!project || !path.isAbsolute(project))
  throw new Error("Pass the existing absolute project path.");
const root = await fs.mkdtemp(
  path.join(os.tmpdir(), "fable5-update-rehearsal-"),
);
await fs.chmod(root, 0o700);
const token = randomUUID().slice(0, 8),
  name = "fable5-update-fixture-" + token;
const repo = path.join(root, "source"),
  bare = path.join(root, "fixture.git");
let offline = false;
const server = createServer(async (req, res) => {
  if (offline) {
    res.writeHead(503);
    res.end();
    return;
  }
  try {
    const relative = decodeURIComponent(
      new URL(req.url, "http://localhost").pathname,
    ).replace(/^\/fixture\.git\/?/, "");
    const file = path.resolve(bare, relative);
    if (!file.startsWith(bare + path.sep) || !(await fs.stat(file)).isFile())
      throw new Error();
    res.writeHead(200);
    createReadStream(file).pipe(res);
  } catch {
    res.writeHead(404);
    res.end();
  }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const identity = {
  plugin: name,
  marketplace: name,
  pluginId: name + "@" + name,
  server: "fable5_update_fixture_" + token,
  source: "http://127.0.0.1:" + server.address().port + "/fixture.git",
};
const baseline = new NativeBackend();
const userLayer = async () => {
  const d = await rpc(baseline.codex, "config/read", { includeLayers: true });
  return d.layers.find((l) => l.name.type === "user" && !l.name.profile);
};
const initial = await userLayer();
const withoutFixture = (config) => {
  const result = structuredClone(config);
  if (result.plugins) delete result.plugins[identity.pluginId];
  if (result.marketplaces) delete result.marketplaces[name];
  return result;
};
const backend = new NativeBackend({
  identity,
  backupDirectory: path.join(root, "backups"),
});
const mutate = backend.mutate.bind(backend);
backend.mutate = async (args, expected) => {
  try {
    return await mutate(args, expected);
  } catch (error) {
    if (error.code === "SETTINGS_CONFLICT") {
      const actual = await backend.settings();
      // Fixture-only settings contain no credentials; never dump the user layer.
      console.error(
        JSON.stringify({
          fixture_operation: args.slice(0, 2),
          expected,
          owned: backend.owned,
          actual: { plugin: actual.plugin, marketplace: actual.marketplace },
        }),
      );
    }
    throw error;
  }
};
const runner = fileURLToPath(new URL("../dist/update.mjs", import.meta.url));
const outputs = [];
let registered = false;
async function commit(message) {
  await command("git", ["-C", repo, "add", "-A"]);
  await command("git", [
    "-C",
    repo,
    "-c",
    "user.name=Fable Fixture",
    "-c",
    "user.email=fixture@example.invalid",
    "commit",
    "--quiet",
    "-m",
    message,
  ]);
}
async function publish() {
  await command("git", ["-C", repo, "push", "--quiet", bare, "main"]);
  await command("git", ["--git-dir", bare, "update-server-info"]);
}
async function writeManifest(version) {
  const file = path.join(repo, ".codex-plugin/plugin.json");
  const data = JSON.parse(await fs.readFile(file, "utf8"));
  data.name = name;
  data.version = version;
  await fs.writeFile(file, JSON.stringify(data, null, 2) + "\n");
}
try {
  const installed = await baseline.inspect();
  await copyPackage(installed.path, repo, installed.files);
  await writeManifest("9.8.0");
  const marketFile = path.join(repo, ".agents/plugins/marketplace.json");
  const market = JSON.parse(await fs.readFile(marketFile, "utf8"));
  market.name = name;
  market.plugins[0].name = name;
  await fs.writeFile(marketFile, JSON.stringify(market, null, 2) + "\n");
  const mcpFile = path.join(repo, ".mcp.json");
  const mcp = JSON.parse(await fs.readFile(mcpFile, "utf8"));
  mcp.mcpServers = { [identity.server]: mcp.mcpServers.fable5_skills };
  await fs.writeFile(mcpFile, JSON.stringify(mcp, null, 2) + "\n");
  await command("git", ["init", "--quiet", "--initial-branch=main", repo]);
  await commit("fixture old package");
  await command("git", [
    "clone",
    "--quiet",
    "--bare",
    "--no-hardlinks",
    repo,
    bare,
  ]);
  await command("git", ["--git-dir", bare, "update-server-info"]);
  await backend.cli(
    ["marketplace", "add", identity.source, "--ref", "main"],
    true,
  );
  registered = true;
  await backend.cli(["add", identity.pluginId], true);
  const originalSettings = await backend.settings();
  const policy = {
    enabled: true,
    mcp_servers: {
      [identity.server]: { default_tools_approval_mode: "prompt" },
    },
  };
  await rpc(backend.codex, "config/batchWrite", {
    filePath: originalSettings.file,
    expectedVersion: originalSettings.version,
    edits: [
      {
        keyPath: "plugins." + JSON.stringify(identity.pluginId),
        value: policy,
        mergeStrategy: "replace",
      },
    ],
  });
  const clean = await backend.inspect();
  const markets = await backend.cli(["marketplace", "list"]);
  const checkout = markets.marketplaces.find((m) => m.name === name).root;
  const readme = await fs.readFile(path.join(clean.path, "README.md"));
  const settingsBefore = await backend.settings();
  try {
    for (const folder of [checkout, clean.path])
      await fs.writeFile(
        path.join(folder, "README.md"),
        Buffer.concat([readme, Buffer.from("\nfixture local customization\n")]),
      );
    await assert.rejects(runUpdate(backend, { project, runner }), {
      code: "LOCAL_CHANGES",
    });
    const settingsAfter = await backend.settings();
    assert.deepEqual(settingsAfter.plugin, settingsBefore.plugin);
    assert.deepEqual(settingsAfter.marketplace, settingsBefore.marketplace);
  } finally {
    for (const folder of [checkout, clean.path])
      await fs.writeFile(path.join(folder, "README.md"), readme);
  }
  outputs.push({
    scenario: "native matching local edits rejected before mutation",
    status: "pass",
  });
  const serverFile = path.join(repo, "mcp/dist/server.mjs"),
    sourceFile = path.join(repo, "mcp/src/main.mjs"),
    infoFile = path.join(repo, "mcp/dist/build-info.json");
  const goodServer = await fs.readFile(serverFile),
    goodSource = await fs.readFile(sourceFile),
    goodInfo = await fs.readFile(infoFile);
  await writeManifest("9.9.0");
  await fs.writeFile(serverFile, "process.exit(17);\n");
  await fs.writeFile(sourceFile, "process.exit(17);\n");
  const badInfo = JSON.parse(goodInfo);
  badInfo.inputs["src/main.mjs"] = digest(await fs.readFile(sourceFile));
  badInfo.outputs["dist/server.mjs"] = digest(await fs.readFile(serverFile));
  await fs.writeFile(infoFile, JSON.stringify(badInfo, null, 2) + "\n");
  await commit("fixture broken MCP");
  await publish();
  const automatic = await runUpdate(backend, { project, runner });
  assert.equal(automatic.status, "rolled_back", JSON.stringify(automatic));
  assert.equal(automatic.version, "9.8.0");
  assert.equal(automatic.source, "pinned_git");
  assert.deepEqual((await backend.settings()).plugin, policy);
  outputs.push({
    scenario: "native health failure -> pinned Git rollback",
    status: "pass",
    version: automatic.version,
  });
  const health = backend.health.bind(backend);
  backend.health = async (...args) => {
    if (args[0].version === "9.9.0") offline = true;
    return health(...args);
  };
  const fallback = await runUpdate(backend, { project, runner });
  assert.equal(fallback.status, "rolled_back", JSON.stringify(fallback));
  assert.equal(fallback.source, "local_backup");
  assert.deepEqual((await backend.settings()).plugin, policy);
  offline = false;
  backend.health = health;
  outputs.push({
    scenario: "source unavailable (HTTP 503) -> local backup rollback",
    status: "pass",
    version: fallback.version,
  });
  await writeManifest("9.10.0");
  await fs.writeFile(serverFile, goodServer);
  await fs.writeFile(sourceFile, goodSource);
  await fs.writeFile(infoFile, goodInfo);
  await commit("fixture good MCP");
  await publish();
  const good = await runUpdate(backend, { project, runner });
  assert.equal(good.status, "updated", JSON.stringify(good));
  const manual = await runRollback(backend, { backup: good.backup, project });
  assert.equal(manual.status, "rolled_back");
  const repeated = await runRollback(backend, { backup: good.backup, project });
  assert.equal(repeated.status, "rolled_back");
  assert.deepEqual((await backend.settings()).plugin, policy);
  outputs.push({
    scenario: "native successful update -> explicit rollback twice",
    status: "pass",
    version: repeated.version,
  });
  await fs.writeFile(
    path.join(backend.backupRoot(), "active.json"),
    JSON.stringify({
      pid: 2147483647,
      token: "fixture-stale",
      backup: good.backup,
    }),
    { flag: "wx" },
  );
  const competing = await Promise.allSettled([
    runRollback(backend, { backup: good.backup, project }),
    runRollback(backend, { backup: good.backup, project }),
  ]);
  assert.equal(
    competing.filter(
      (r) => r.status === "fulfilled" && r.value.status === "rolled_back",
    ).length,
    1,
  );
  assert.equal(
    competing.filter(
      (r) => r.status === "rejected" && r.reason.code === "UPDATE_LOCKED",
    ).length,
    1,
  );
  assert.deepEqual((await backend.settings()).plugin, policy);
  outputs.push({
    scenario: "native concurrent stale-lock recovery has one winner",
    status: "pass",
  });
  assert.deepEqual(
    withoutFixture((await userLayer()).config),
    withoutFixture(initial.config),
  );
  outputs.push({
    scenario: "unrelated user settings preserved",
    status: "pass",
  });
  console.log(
    JSON.stringify(
      { source: "real Codex CLI and real MCP calls", results: outputs },
      null,
      2,
    ),
  );
} finally {
  offline = false;
  if (registered) {
    await backend.cli(["remove", identity.pluginId], true).catch(() => {});
    await backend.cli(["marketplace", "remove", name], true).catch(() => {});
    const now = await userLayer();
    await rpc(backend.codex, "config/batchWrite", {
      filePath: now.name.file,
      expectedVersion: now.version,
      edits: [
        {
          keyPath: "plugins." + JSON.stringify(identity.pluginId),
          value: null,
          mergeStrategy: "replace",
        },
        {
          keyPath: "marketplaces." + JSON.stringify(name),
          value: null,
          mergeStrategy: "replace",
        },
      ],
    });
  }
  await new Promise((resolve) => server.close(resolve));
  if (outputs.length === 6) {
    const resolved = await fs.realpath(root),
      temp = await fs.realpath(os.tmpdir());
    assert.equal(path.dirname(resolved), temp);
    assert.ok(path.basename(resolved).startsWith("fable5-update-rehearsal-"));
    await fs.rm(resolved, { recursive: true, force: true });
  } else
    console.error(
      "Rehearsal artifacts retained in private temporary directory:",
      root,
    );
}
