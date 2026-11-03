import assert from "node:assert/strict";
import { test } from "node:test";
import * as fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { NativeBackend, command } from "../src/update-native.mjs";
import { inventory, copyPackage } from "../src/update-core.mjs";

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
  assert.equal((await backend.validatePackage(temp)).version, "1.3.0");
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
