// Deterministic state-machine tests. Real Codex rollback is a separate native rehearsal.
import assert from "node:assert/strict";
import { test } from "node:test";
import * as fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import {
  runUpdate,
  runRollback,
  inventory,
  equal,
  UpdateError,
  digest,
  writeJson,
} from "../src/update-core.mjs";

async function fixture(t, flags = {}) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "fable5-update-unit-"));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const config = path.join(root, "config.toml"),
    installed = path.join(root, "installed");
  await fs.mkdir(installed);
  await fs.writeFile(path.join(installed, "old.txt"), "previous package");
  await fs.writeFile(config, 'model = "keep"\n# settings snapshot\n');
  const before = {
    configFile: config,
    path: installed,
    files: await inventory(installed),
    version: "1.2.0",
    commit: "a".repeat(40),
    pluginSettings: {
      enabled: true,
      mcp_servers: { test: { default_tools_approval_mode: "prompt" } },
    },
    marketplaceSettings: {
      source_type: "git",
      source: "https://example.invalid/test",
      ref: "main",
    },
  };
  const identity = {
    pluginId: "fable5-codex@fable5",
    marketplace: "fable5",
    plugin: "fable5-codex",
  };
  const backend = {
    identity,
    events: [],
    version: before.version,
    unrelated: "keep",
    backupRoot: () => path.join(root, "backups"),
    inspect: async () => structuredClone(before),
    assertSettings: async () => {
      if (flags.conflict)
        throw new UpdateError("SETTINGS_CONFLICT", "fixture conflict");
    },
    stage: async () => {
      if (flags.preflight) throw new UpdateError("FETCH_FAILED", "fixture");
      return {
        version: "1.3.0",
        commit: "b".repeat(40),
        files: {},
        sourceSettings: { ref: "b".repeat(40) },
      };
    },
    install: async () => {
      const dirs = (
        await fs.readdir(path.join(root, "backups"), { withFileTypes: true })
      ).filter((d) => d.isDirectory());
      const backup = path.join(root, "backups", dirs[0].name);
      assert.equal(
        await fs.readFile(path.join(backup, "config.toml"), "utf8"),
        await fs.readFile(config, "utf8"),
      );
      assert.ok(
        equal(await inventory(path.join(backup, "package")), before.files),
      );
      assert.ok(await fs.stat(path.join(backup, "recover.mjs")));
      backend.events.push("install");
      backend.version = "1.3.0";
      if (flags.install)
        throw new UpdateError(
          flags.uncertain ? "UNCERTAIN" : "INSTALL_FAILED",
          "fixture",
        );
      return { path: installed, version: "1.3.0" };
    },
    health: async (state) => {
      backend.events.push("health:" + state.version);
      if (
        (state.version === "1.3.0" && flags.health) ||
        (state.version === "1.2.0" && flags.restoreHealth)
      )
        throw new UpdateError("HEALTH_FAILED", "fixture");
    },
    restore: async (saved) => {
      backend.events.push("restore");
      if (flags.restore) throw new UpdateError("RESTORE_FAILED", "fixture");
      backend.version = saved.version;
      return {
        path: installed,
        version: saved.version,
        sourceMode: "local_backup",
      };
    },
  };
  const runner = path.join(root, "runner.mjs");
  await fs.writeFile(runner, "// test recovery runner");
  return { root, before, backend, options: { project: root, runner } };
}

test("successful update snapshots settings/package/runner before mutation", async (t) => {
  const f = await fixture(t);
  const result = await runUpdate(f.backend, f.options);
  assert.equal(result.status, "updated");
  assert.deepEqual(f.backend.events, ["install", "health:1.3.0"]);
  assert.equal(f.backend.unrelated, "keep");
  await assert.rejects(fs.stat(path.join(f.root, "backups/active.json")), {
    code: "ENOENT",
  });
});
test("candidate failure before mutation leaves the installation unchanged", async (t) => {
  const f = await fixture(t, { preflight: true });
  const result = await runUpdate(f.backend, f.options);
  assert.equal(result.status, "unchanged");
  assert.deepEqual(f.backend.events, []);
  assert.equal(f.backend.version, "1.2.0");
});
for (const failure of ["install", "health"])
  test("automatic rollback after " + failure + " failure", async (t) => {
    const f = await fixture(t, { [failure]: true });
    const result = await runUpdate(f.backend, f.options);
    assert.equal(result.status, "rolled_back");
    assert.equal(f.backend.version, "1.2.0");
    assert.ok(f.backend.events.includes("health:1.2.0"));
    assert.equal(f.backend.unrelated, "keep");
  });
test("failed restoration never reports successful rollback and retains recovery state", async (t) => {
  const f = await fixture(t, { health: true, restore: true });
  const result = await runUpdate(f.backend, f.options);
  assert.equal(result.status, "recovery_required");
  assert.equal(result.restore_error, "RESTORE_FAILED");
  assert.ok(await fs.stat(path.join(f.root, "backups/active.json")));
});
test("old-version health must pass before rollback can be called successful", async (t) => {
  const f = await fixture(t, { health: true, restoreHealth: true });
  const result = await runUpdate(f.backend, f.options);
  assert.equal(result.status, "recovery_required");
});
test("ambiguous timeout does not blindly replay native mutations", async (t) => {
  const f = await fixture(t, { install: true, uncertain: true });
  const result = await runUpdate(f.backend, f.options);
  assert.equal(result.status, "recovery_required");
  assert.deepEqual(f.backend.events, ["install"]);
});
test("configuration conflict is detected before mutation", async (t) => {
  const f = await fixture(t, { conflict: true });
  const result = await runUpdate(f.backend, f.options);
  assert.equal(result.status, "unchanged");
  assert.equal(result.error_code, "SETTINGS_CONFLICT");
  assert.deepEqual(f.backend.events, []);
});
test("manual rollback is repeatable and verifies backup integrity", async (t) => {
  const f = await fixture(t);
  const updated = await runUpdate(f.backend, f.options);
  for (let i = 0; i < 2; i++)
    assert.equal(
      (
        await runRollback(f.backend, {
          backup: updated.backup,
          project: f.root,
        })
      ).status,
      "rolled_back",
    );
  await fs.writeFile(path.join(updated.backup, "package/old.txt"), "damaged");
  await assert.rejects(
    runRollback(f.backend, { backup: updated.backup, project: f.root }),
    { code: "INVALID_BACKUP" },
  );
});
test("backup settings and metadata corruption are rejected before restore", async (t) => {
  const f = await fixture(t);
  const result = await runUpdate(f.backend, f.options);
  const file = path.join(result.backup, "transaction.json");
  const state = JSON.parse(await fs.readFile(file, "utf8"));
  state.before.pluginSettings.enabled = false;
  await fs.writeFile(file, JSON.stringify(state));
  await assert.rejects(
    runRollback(f.backend, { backup: result.backup, project: f.root }),
    { code: "INVALID_BACKUP" },
  );
});
test("an existing lock prevents a second updater", async (t) => {
  const f = await fixture(t);
  const root = f.backend.backupRoot();
  await fs.mkdir(root);
  await fs.writeFile(
    path.join(root, "active.json"),
    JSON.stringify({ pid: process.pid, backup: "active" }),
  );
  await assert.rejects(runUpdate(f.backend, f.options), {
    code: "UPDATE_LOCKED",
  });
});
test("explicit recovery can resume a stale transaction from a dead process", async (t) => {
  const f = await fixture(t);
  const updated = await runUpdate(f.backend, f.options);
  await fs.writeFile(
    path.join(f.backend.backupRoot(), "active.json"),
    JSON.stringify({ pid: 2147483647, backup: updated.backup }),
  );
  assert.equal(
    (await runRollback(f.backend, { backup: updated.backup, project: f.root }))
      .status,
    "rolled_back",
  );
});

for (const file of ["config.toml", "recover.mjs"])
  test(file + " integrity is bound to the immutable snapshot", async (t) => {
    const f = await fixture(t);
    const updated = await runUpdate(f.backend, f.options);
    await fs.writeFile(path.join(updated.backup, file), "changed");
    const transaction = path.join(updated.backup, "transaction.json");
    const state = JSON.parse(await fs.readFile(transaction, "utf8"));
    state[file === "config.toml" ? "config_sha256" : "runner_sha256"] = digest(
      Buffer.from("changed"),
    );
    await fs.writeFile(transaction, JSON.stringify(state));
    await assert.rejects(
      runRollback(f.backend, { backup: updated.backup, project: f.root }),
      { code: "INVALID_BACKUP" },
    );
    assert.ok(!f.backend.events.includes("restore"));
  });

test("malformed or live lock cannot be reclaimed by manual rollback", async (t) => {
  const f = await fixture(t);
  const updated = await runUpdate(f.backend, f.options);
  for (const pid of [undefined, 0, -1, "wrong", process.pid]) {
    await fs.writeFile(
      path.join(f.backend.backupRoot(), "active.json"),
      JSON.stringify({ pid, backup: updated.backup }),
    );
    await assert.rejects(
      runRollback(f.backend, { backup: updated.backup, project: f.root }),
      { code: "UPDATE_LOCKED" },
    );
  }
  assert.ok(!f.backend.events.includes("restore"));
});

test("lack of disk space refuses the update before backup or mutation", async (t) => {
  const f = await fixture(t);
  f.backend.secureBackupRoot = async () => {
    throw new UpdateError("NO_SPACE", "fixture");
  };
  await assert.rejects(runUpdate(f.backend, f.options), { code: "NO_SPACE" });
  assert.deepEqual(f.backend.events, []);
});

test("journal write failure after installation still attempts verified restoration", async (t) => {
  const f = await fixture(t);
  const journal = async (file, state) => {
    if (
      ["checking", "rolling_back", "rolled_back", "recovery_required"].includes(
        state.phase,
      )
    )
      throw Object.assign(new Error("fixture full disk"), { code: "ENOSPC" });
    await writeJson(file, state);
  };
  const result = await runUpdate(f.backend, { ...f.options, journal });
  assert.equal(result.status, "recovery_required");
  assert.equal(result.restore_error, "ENOSPC");
  assert.equal(f.backend.version, "1.2.0");
  assert.ok(f.backend.events.includes("restore"));
  assert.ok(f.backend.events.includes("health:1.2.0"));
  assert.ok(await fs.stat(path.join(f.backend.backupRoot(), "active.json")));
});
