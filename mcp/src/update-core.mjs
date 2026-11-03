import * as fs from "node:fs/promises";
import path from "node:path";
import { randomUUID, createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";

export class UpdateError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}
export const digest = (bytes) =>
  createHash("sha256").update(bytes).digest("hex");
export const equal = isDeepStrictEqual;
export async function writeJson(file, value) {
  const temp = file + "." + randomUUID() + ".tmp";
  const handle = await fs.open(temp, "wx", 0o600);
  try {
    await handle.writeFile(JSON.stringify(value, null, 2) + "\n");
    await handle.sync();
  } finally {
    await handle.close();
  }
  await fs.rename(temp, file);
}
export async function inventory(root) {
  const files = {};
  let total = 0;
  async function walk(folder) {
    for (const entry of (
      await fs.readdir(folder, { withFileTypes: true })
    ).sort((a, b) => a.name.localeCompare(b.name))) {
      if (entry.name === ".git" || entry.name === "node_modules") continue;
      const file = path.join(folder, entry.name);
      if (entry.isSymbolicLink())
        throw new UpdateError(
          "UNSAFE_PACKAGE",
          "Package symlinks are not supported.",
        );
      if (entry.isDirectory()) await walk(file);
      else if (entry.isFile()) {
        const stat = await fs.stat(file);
        total += stat.size;
        if (
          stat.size > 64 * 1024 * 1024 ||
          total > 256 * 1024 * 1024 ||
          Object.keys(files).length >= 10000
        )
          throw new UpdateError(
            "PACKAGE_TOO_LARGE",
            "Package exceeds backup limits.",
          );
        files[path.relative(root, file).split(path.sep).join("/")] = digest(
          await fs.readFile(file),
        );
      } else
        throw new UpdateError(
          "UNSAFE_PACKAGE",
          "Package must contain regular files.",
        );
    }
  }
  await walk(root);
  return files;
}
export async function copyPackage(source, target, files) {
  await fs.mkdir(target, { recursive: true, mode: 0o700 });
  for (const name of Object.keys(files)) {
    const parts = name.split("/");
    if (
      path.isAbsolute(name) ||
      parts.some((p) => !p || p === ".." || p === ".") ||
      name.includes("\\")
    )
      throw new UpdateError("INVALID_BACKUP", "Invalid package path.");
    const destination = path.join(target, ...parts);
    await fs.mkdir(path.dirname(destination), { recursive: true, mode: 0o700 });
    await fs.copyFile(path.join(source, ...parts), destination);
  }
  if (!equal(await inventory(target), files))
    throw new UpdateError(
      "BACKUP_CHANGED",
      "Package copy failed verification.",
    );
}
const terminal = new Set(["updated", "rolled_back", "unchanged"]);
async function lock(root, backup = null) {
  await fs.mkdir(root, { recursive: true, mode: 0o700 });
  const file = path.join(root, "active.json");
  try {
    const handle = await fs.open(file, "wx", 0o600);
    const token = randomUUID();
    await handle.writeFile(JSON.stringify({ pid: process.pid, token, backup }));
    await handle.close();
    return async () => {
      const value = JSON.parse(await fs.readFile(file, "utf8"));
      if (value.token === token) await fs.unlink(file);
    };
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
    throw new UpdateError(
      "UPDATE_LOCKED",
      "Another or interrupted update exists; inspect active.json and use rollback before updating again.",
    );
  }
}
export async function loadBackup(backup, identity) {
  const state = JSON.parse(
    await fs.readFile(path.join(backup, "transaction.json"), "utf8"),
  );
  const snapshotBytes = await fs.readFile(path.join(backup, "snapshot.json"));
  const snapshot = JSON.parse(snapshotBytes);
  if (
    digest(snapshotBytes) !== state.snapshot_sha256 ||
    !equal(state.before, snapshot.before) ||
    !equal(state.identity, snapshot.identity) ||
    state.config_sha256 !== snapshot.config_sha256 ||
    state.runner_sha256 !== snapshot.runner_sha256
  )
    throw new UpdateError("INVALID_BACKUP", "Backup metadata is damaged.");
  if (
    state.schema !== 1 ||
    state.identity.pluginId !== identity.pluginId ||
    state.identity.marketplace !== identity.marketplace
  )
    throw new UpdateError(
      "INVALID_BACKUP",
      "Backup identity does not match this updater.",
    );
  if (
    !equal(await inventory(path.join(backup, "package")), state.before.files) ||
    digest(await fs.readFile(path.join(backup, "config.toml"))) !==
      state.config_sha256 ||
    digest(await fs.readFile(path.join(backup, "recover.mjs"))) !==
      state.runner_sha256
  )
    throw new UpdateError(
      "INVALID_BACKUP",
      "Backup package or settings are damaged.",
    );
  return state;
}

export async function runUpdate(
  backend,
  { project, ref = "main", runner, journal = writeJson },
) {
  await backend.preflightProject?.(project);
  const before = await backend.inspect();
  const root = backend.backupRoot(before);
  await backend.secureBackupRoot?.(root, before);
  const backup = path.join(
    root,
    new Date().toISOString().replace(/[:.]/g, "-") +
      "-" +
      randomUUID().slice(0, 8),
  );
  const release = await lock(root, backup);
  let state,
    changed = false;
  try {
    await fs.mkdir(backup, { mode: 0o700 });
    const config = await fs.readFile(before.configFile);
    await fs.writeFile(path.join(backup, "config.toml"), config, {
      mode: 0o600,
      flag: "wx",
    });
    await copyPackage(before.path, path.join(backup, "package"), before.files);
    await fs.copyFile(runner, path.join(backup, "recover.mjs"));
    const runnerHash = digest(
      await fs.readFile(path.join(backup, "recover.mjs")),
    );
    const snapshot =
      JSON.stringify(
        {
          identity: backend.identity,
          before,
          config_sha256: digest(config),
          runner_sha256: runnerHash,
        },
        null,
        2,
      ) + "\n";
    await fs.writeFile(path.join(backup, "snapshot.json"), snapshot, {
      mode: 0o600,
      flag: "wx",
    });
    state = {
      schema: 1,
      identity: backend.identity,
      phase: "backed_up",
      before,
      config_sha256: digest(config),
      runner_sha256: runnerHash,
      snapshot_sha256: digest(Buffer.from(snapshot)),
      project,
      ref,
      created_at: new Date().toISOString(),
    };
    const persist = async (phase) => {
      state.phase = phase;
      await journal(path.join(backup, "transaction.json"), state);
    };
    await persist("backed_up");
    const candidate = await backend.stage(ref, backup);
    await backend.preflightSpace?.(before, backup, candidate);
    candidate.sourceSettings = {
      ...before.marketplaceSettings,
      ...candidate.sourceSettings,
    };
    state.candidate = candidate;
    await backend.assertSettings(before);
    await persist("installing");
    changed = true;
    const installed = await backend.install(candidate, before);
    await persist("checking");
    await backend.health(installed, project, candidate.files);
    await backend.assertSettings(before, candidate.sourceSettings);
    await persist("updated");
    return {
      status: "updated",
      version: candidate.version,
      commit: candidate.commit,
      backup,
    };
  } catch (error) {
    if (!state) throw error;
    state.error_code = error.code || "UPDATE_FAILED";
    if (!changed) {
      state.phase = "unchanged";
      await journal(path.join(backup, "transaction.json"), state).catch(
        () => {},
      );
      return { status: "unchanged", error_code: state.error_code, backup };
    }
    if (["UNCERTAIN", "SETTINGS_CONFLICT"].includes(error.code)) {
      state.phase = "recovery_required";
      await journal(path.join(backup, "transaction.json"), state).catch(
        () => {},
      );
      return { status: state.phase, error_code: state.error_code, backup };
    }
    try {
      state.phase = "rolling_back";
      // A full disk must not prevent an attempt to restore the verified snapshot.
      await journal(path.join(backup, "transaction.json"), state).catch(
        () => {},
      );
      await loadBackup(backup, backend.identity);
      const restored = await backend.restore(before, backup);
      await backend.health(restored, project, before.files);
      await backend.assertSettings(before, restored.sourceSettings);
      state.phase = "rolled_back";
      state.restore_source = restored.sourceMode;
      await journal(path.join(backup, "transaction.json"), state);
      return {
        status: "rolled_back",
        version: before.version,
        error_code: state.error_code,
        source: restored.sourceMode,
        backup,
      };
    } catch (restoreError) {
      state.phase = "recovery_required";
      state.restore_error = restoreError.code || "RESTORE_FAILED";
      await journal(path.join(backup, "transaction.json"), state).catch(
        () => {},
      );
      return {
        status: state.phase,
        error_code: state.error_code,
        restore_error: state.restore_error,
        backup,
      };
    }
  } finally {
    // A known failure keeps the journal; ambiguous/incomplete operations keep the lock too.
    if (!state || terminal.has(state.phase)) await release();
  }
}

export async function runRollback(backend, { backup, project }) {
  await backend.preflightProject?.(project);
  const state = await loadBackup(backup, backend.identity);
  const root = backend.backupRoot(state.before);
  const lockFile = path.join(root, "active.json");
  try {
    const previous = JSON.parse(await fs.readFile(lockFile, "utf8"));
    if (!Number.isInteger(previous.pid) || previous.pid <= 0)
      throw new UpdateError(
        "UPDATE_LOCKED",
        "Lock has an invalid process ID; inspect it before recovery.",
      );
    if (path.resolve(previous.backup || "") !== path.resolve(backup))
      throw new UpdateError("UPDATE_LOCKED", "Lock belongs to another update.");
    let running = false;
    try {
      process.kill(previous.pid, 0);
      running = true;
    } catch (error) {
      if (error.code !== "ESRCH") running = true;
    }
    if (running)
      throw new UpdateError(
        "UPDATE_LOCKED",
        "Update process is still running.",
      );
    await fs.unlink(lockFile);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  const release = await lock(root, backup);
  try {
    state.phase = "rolling_back";
    await writeJson(path.join(backup, "transaction.json"), state).catch(
      () => {},
    );
    const restored = await backend.restore(state.before, backup);
    await backend.health(restored, project, state.before.files);
    await backend.assertSettings(state.before, restored.sourceSettings);
    state.phase = "rolled_back";
    state.restore_source = restored.sourceMode;
    await writeJson(path.join(backup, "transaction.json"), state);
    await release();
    return {
      status: "rolled_back",
      version: state.before.version,
      source: restored.sourceMode,
      backup,
    };
  } catch (error) {
    state.phase = "recovery_required";
    state.restore_error = error.code || "RESTORE_FAILED";
    await writeJson(path.join(backup, "transaction.json"), state).catch(
      () => {},
    );
    throw error;
  }
}
