import assert from "node:assert/strict";
import { test } from "node:test";
import * as fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { NativeBackend, command } from "../src/update-native.mjs";
import { inventory, copyPackage, UpdateError } from "../src/update-core.mjs";

const root = fileURLToPath(new URL("../../", import.meta.url));
test("bundled help and invalid arguments run without Codex or node_modules", async (t) => {
  const temp = await fs.mkdtemp(
    path.join(os.tmpdir(), "fable5-update-bundle-"),
  );
  t.after(() => fs.rm(temp, { recursive: true, force: true }));
  const runner = path.join(temp, "update.mjs");
  await fs.copyFile(path.join(root, "mcp/dist/update.mjs"), runner);
  const help = await command(process.execPath, [runner, "--help"], {
    cwd: temp,
  });
  assert.match(help, /rollback --project/);
  for (const args of [
    [],
    ["unknown"],
    ["update", "--project", temp, "--backup", temp],
    ["rollback", "--project", temp, "--backup", temp, "--ref", "main"],
  ])
    await assert.rejects(
      command(process.execPath, [runner, ...args], { cwd: temp }),
      { code: "COMMAND_FAILED" },
    );
});
test("missing commands and read-only/mutating timeouts have distinct outcomes", async () => {
  await assert.rejects(
    command(process.execPath, [
      "-e",
      'console.error("failed to back up plugin cache entry (os error 5)");process.exit(1)',
    ]),
    { code: "CACHE_BUSY" },
  );
  await assert.rejects(command("missing-fable5-executable-3a4f", []), {
    code: "MISSING_COMMAND",
  });
  for (const mutation of [false, true])
    await assert.rejects(
      command(process.execPath, ["-e", "setInterval(()=>{},1000)"], {
        timeout: 100,
        mutation,
      }),
      { code: mutation ? "UNCERTAIN" : "COMMAND_TIMEOUT" },
    );
});
test("project must exist before update or rollback", async () => {
  const backend = new NativeBackend();
  await assert.rejects(backend.preflightProject("relative"), {
    code: "INVALID_PROJECT",
  });
  await assert.rejects(
    backend.preflightProject(
      path.join(os.tmpdir(), "missing-fable5-project-3a4f"),
    ),
    { code: "INVALID_PROJECT" },
  );
});
test("same-target concurrent changes are rejected, unrelated settings do not conflict", async () => {
  const backend = new NativeBackend();
  const target = {
    file: "config.toml",
    plugin: { enabled: true },
    marketplace: { ref: "old" },
  };
  backend.settings = async () => structuredClone(target);
  await backend.guard();
  target.unrelated = { value: "new" };
  await backend.guard();
  target.plugin.enabled = false;
  await assert.rejects(backend.guard(), { code: "SETTINGS_CONFLICT" });
});
test("candidate validation rejects missing build entries and tampered bundles", async (t) => {
  const temp = await fs.mkdtemp(
    path.join(os.tmpdir(), "fable5-update-package-"),
  );
  t.after(() => fs.rm(temp, { recursive: true, force: true }));
  await copyPackage(root, temp, await inventory(root));
  const backend = new NativeBackend();
  assert.equal((await backend.validatePackage(temp)).version, "1.3.1");
  const infoFile = path.join(temp, "mcp/dist/build-info.json");
  const info = await fs.readFile(infoFile, "utf8"),
    changed = JSON.parse(info);
  delete changed.outputs["dist/update.mjs"];
  await fs.writeFile(infoFile, JSON.stringify(changed));
  await assert.rejects(backend.validatePackage(temp), {
    code: "INVALID_PACKAGE",
  });
  await fs.writeFile(infoFile, info);
  await fs.appendFile(path.join(temp, "mcp/dist/update.mjs"), "\n// damaged");
  await assert.rejects(backend.validatePackage(temp), {
    code: "INVALID_PACKAGE",
  });
});

test("busy old cache uses a fresh recovery slot while preserving every other byte", async (t) => {
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), "fable5-busy-cache-"));
  t.after(() => fs.rm(temp, { recursive: true, force: true }));
  const packageRoot = path.join(temp, "package");
  await fs.mkdir(path.join(packageRoot, ".codex-plugin"), { recursive: true });
  await fs.writeFile(
    path.join(packageRoot, ".codex-plugin/plugin.json"),
    JSON.stringify({ name: "fable5-codex", version: "1.2.0" }),
  );
  await fs.writeFile(path.join(packageRoot, "skill.txt"), "unchanged skill");
  const before = {
    version: "1.2.0",
    commit: "a".repeat(40),
    files: await inventory(packageRoot),
    pluginSettings: { enabled: true },
  };
  const backend = new NativeBackend();
  let calls = 0;
  backend.installSource = async (source) => {
    calls++;
    if (calls <= 2) throw new UpdateError("CACHE_BUSY", "fixture");
    backend.owned = { marketplace: { source_type: "local", source } };
    const manifest = JSON.parse(
      await fs.readFile(path.join(source, ".codex-plugin/plugin.json"), "utf8"),
    );
    return { path: source, version: manifest.version };
  };
  backend.setSettings = async () => {};
  const restored = await backend.restore(before, temp);
  assert.equal(restored.version, "1.2.0");
  assert.match(restored.installedVersion, /^1\.2\.0\+recovery\./);
  assert.equal(restored.sourceMode, "local_recovery");
  assert.equal(
    await fs.readFile(path.join(restored.path, "skill.txt"), "utf8"),
    "unchanged skill",
  );
  assert.deepEqual(Object.keys(restored.files), Object.keys(before.files));
  assert.equal(restored.files["skill.txt"], before.files["skill.txt"]);
  assert.notEqual(
    restored.files[".codex-plugin/plugin.json"],
    before.files[".codex-plugin/plugin.json"],
  );
  assert.equal(
    JSON.parse(
      await fs.readFile(
        path.join(packageRoot, ".codex-plugin/plugin.json"),
        "utf8",
      ),
    ).version,
    "1.2.0",
  );
});
