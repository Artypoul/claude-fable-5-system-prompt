import * as fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { randomUUID, createHash } from "node:crypto";
import { Client } from "@modelcontextprotocol/client";
import {
  StdioClientTransport,
  getDefaultEnvironment,
} from "@modelcontextprotocol/client/stdio";
import {
  inventory,
  copyPackage,
  equal,
  digest,
  UpdateError,
} from "./update-core.mjs";
import { fetchNativeCatalog } from "./catalog.mjs";

export const DEFAULT_IDENTITY = {
  plugin: "fable5-codex",
  marketplace: "fable5",
  pluginId: "fable5-codex@fable5",
  server: "fable5_skills",
  source: "https://github.com/Artypoul/claude-fable-5-system-prompt.git",
};

export async function command(
  binary,
  args,
  { cwd, mutation = false, timeout = 90000 } = {},
) {
  return new Promise((resolve, reject) => {
    const child = spawn(binary, args, {
      cwd,
      shell: false,
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "",
      size = 0,
      finished = false,
      diagnostics = "";
    const finish = (error, value) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      error ? reject(error) : resolve(value);
    };
    const timer = setTimeout(() => {
      child.kill();
      finish(
        new UpdateError(
          mutation ? "UNCERTAIN" : "COMMAND_TIMEOUT",
          "Command timed out; inspect the saved transaction.",
        ),
      );
    }, timeout);
    child.on("error", () =>
      finish(
        new UpdateError(
          "MISSING_COMMAND",
          "Required executable could not start.",
        ),
      ),
    );
    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (data) => {
      size += Buffer.byteLength(data);
      if (size > 16 * 1024 * 1024) {
        child.kill();
        finish(
          new UpdateError(
            mutation ? "UNCERTAIN" : "OUTPUT_LIMIT",
            "Command output exceeded its limit.",
          ),
        );
      } else stdout += data;
    });
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (data) => {
      diagnostics = (diagnostics + data).slice(-16384);
    });
    child.on("close", (code) =>
      finish(
        code !== 0
          ? new UpdateError(
              code === null && mutation
                ? "UNCERTAIN"
                : /failed to back up plugin cache entry/i.test(diagnostics) &&
                    /os error (?:5|32|33)/.test(diagnostics)
                  ? "CACHE_BUSY"
                  : "COMMAND_FAILED",
              "Native command failed.",
            )
          : null,
        stdout,
      ),
    );
  });
}

export async function rpc(codex, method, params, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(codex, ["app-server", "--stdio"], {
      cwd,
      shell: false,
      windowsHide: true,
      stdio: ["pipe", "pipe", "ignore"],
    });
    let pending = "",
      finished = false,
      received = 0,
      sent = false;
    const connectionError = () =>
      new UpdateError(
        sent && method === "config/batchWrite" ? "UNCERTAIN" : "RPC_FAILED",
        "Codex API connection closed before responding.",
      );
    const finish = (error, value) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      child.stdin.destroy();
      child.kill();
      error ? reject(error) : resolve(value);
    };
    const timer = setTimeout(
      () =>
        finish(
          new UpdateError(
            method === "config/batchWrite" ? "UNCERTAIN" : "RPC_TIMEOUT",
            "Codex configuration API timed out.",
          ),
        ),
      30000,
    );
    const send = (value) => {
      if (!finished) child.stdin.write(JSON.stringify(value) + "\n");
    };
    child.on("error", () =>
      finish(new UpdateError("MISSING_CODEX", "Codex CLI could not start.")),
    );
    child.stdin.on("error", () => finish(connectionError()));
    child.on("close", () => finish(connectionError()));
    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      received += Buffer.byteLength(chunk);
      if (received > 16 * 1024 * 1024) {
        finish(connectionError());
        return;
      }
      pending += chunk;
      let end;
      while ((end = pending.indexOf("\n")) >= 0) {
        const line = pending.slice(0, end);
        pending = pending.slice(end + 1);
        if (!line.trim()) continue;
        let item;
        try {
          item = JSON.parse(line);
        } catch {
          finish(connectionError());
          return;
        }
        if (item.id !== 1 && item.id !== 2) continue;
        if (item.error) {
          finish(
            new UpdateError(
              method === "config/batchWrite"
                ? "SETTINGS_CONFLICT"
                : "RPC_FAILED",
              "Codex rejected the operation; configuration may have changed.",
            ),
          );
          return;
        }
        if (item.id === 1) {
          send({ method: "initialized", params: {} });
          sent = true;
          send({ id: 2, method, params });
        } else finish(null, item.result);
      }
    });
    send({
      id: 1,
      method: "initialize",
      params: {
        clientInfo: { name: "fable5-safe-update", version: "0.1.0" },
        capabilities: { experimentalApi: true },
      },
    });
  });
}

export class NativeBackend {
  constructor({
    identity = DEFAULT_IDENTITY,
    codex = process.env.FABLE5_CODEX_BIN || "codex",
    git = "git",
    backupDirectory,
  } = {}) {
    this.identity = identity;
    this.codex = codex;
    this.git = git;
    this.backupDirectory = backupDirectory;
  }
  async cli(args, mutation = false) {
    return JSON.parse(
      await command(this.codex, ["plugin", ...args, "--json"], { mutation }),
    );
  }
  async preflightProject(project) {
    if (
      !path.isAbsolute(project) ||
      !(await fs.stat(project).catch(() => null))?.isDirectory()
    )
      throw new UpdateError(
        "INVALID_PROJECT",
        "Project must be an existing absolute directory.",
      );
  }
  async settings() {
    const result = await rpc(this.codex, "config/read", {
      includeLayers: true,
    });
    const layer = result.layers?.find(
      (l) => l.name.type === "user" && !l.name.profile,
    );
    if (!layer?.name.file || !layer.version)
      throw new UpdateError(
        "UNSUPPORTED_CONFIG",
        "A writable base user config layer is required.",
      );
    return {
      file: layer.name.file,
      version: layer.version,
      plugin: layer.config.plugins?.[this.identity.pluginId] ?? null,
      marketplace:
        layer.config.marketplaces?.[this.identity.marketplace] ?? null,
    };
  }
  backupRoot(before) {
    return (
      this.backupDirectory ||
      path.join(
        path.dirname(before.configFile),
        "plugin-backups",
        this.identity.plugin,
      )
    );
  }
  async secureBackupRoot(root, before) {
    await fs.mkdir(root, { recursive: true, mode: 0o700 });
    const stat = await fs.lstat(root);
    if (!stat.isDirectory() || stat.isSymbolicLink())
      throw new UpdateError(
        "UNSAFE_BACKUP",
        "Backup root must be a regular directory.",
      );
    if (!this.backupDirectory) {
      const base = await fs.realpath(path.dirname(before.configFile)),
        real = await fs.realpath(root);
      if (!real.startsWith(base + path.sep))
        throw new UpdateError(
          "UNSAFE_BACKUP",
          "Backup root escapes the Codex profile.",
        );
    }
    if (process.platform !== "win32") await fs.chmod(root, 0o700);
    const bytes = (
      await Promise.all(
        Object.keys(before.files).map((name) =>
          fs.stat(path.join(before.path, name)),
        ),
      )
    ).reduce((total, stat) => total + stat.size, 0);
    await this.ensureSpace(
      root,
      Math.max(128 * 1024 * 1024, bytes * 4 + 32 * 1024 * 1024),
    );
  }
  async ensureSpace(folder, required) {
    const stats = await fs.statfs(folder);
    if (stats.bavail * stats.bsize < required)
      throw new UpdateError(
        "NO_SPACE",
        "Insufficient free space for backup, installation and recovery; free disk space before retrying.",
      );
  }
  async preflightSpace(before, backup, candidate) {
    const bytes = (
      await Promise.all(
        Object.keys(candidate.files).map((name) =>
          fs.stat(path.join(backup, "candidate", name)),
        ),
      )
    ).reduce((total, stat) => total + stat.size, 0);
    await this.ensureSpace(
      backup,
      Math.max(64 * 1024 * 1024, bytes * 2 + 32 * 1024 * 1024),
    );
  }
  async inspect() {
    const settings = await this.settings();
    const listed = await this.cli([
      "list",
      "--marketplace",
      this.identity.marketplace,
    ]);
    const installed = listed.installed?.find(
      (p) => p.pluginId === this.identity.pluginId,
    );
    if (
      !installed?.installed ||
      !installed.enabled ||
      settings.plugin?.enabled === false
    )
      throw new UpdateError(
        "NOT_INSTALLED",
        "Safe update requires an installed enabled plugin.",
      );
    const sources = await this.cli(["marketplace", "list"]);
    const market = sources.marketplaces?.find(
      (m) => m.name === this.identity.marketplace,
    );
    if (!market || !settings.marketplace)
      throw new UpdateError(
        "UNSUPPORTED_SOURCE",
        "Marketplace settings are missing.",
      );
    if (settings.marketplace.sparse_paths?.length)
      throw new UpdateError(
        "UNSUPPORTED_SOURCE",
        "Safe update requires the complete marketplace checkout.",
      );
    const manifest = JSON.parse(
      await fs.readFile(
        path.join(market.root, ".codex-plugin/plugin.json"),
        "utf8",
      ),
    );
    if (manifest.name !== this.identity.plugin)
      throw new UpdateError(
        "INVALID_PACKAGE",
        "Installed plugin identity differs.",
      );
    const cached = path.join(
      path.dirname(settings.file),
      "plugins",
      "cache",
      this.identity.marketplace,
      this.identity.plugin,
      installed.version,
    );
    const files = await inventory(cached);
    if (
      manifest.version !== installed.version ||
      !equal(files, await inventory(market.root))
    )
      throw new UpdateError(
        "LOCAL_CHANGES",
        "Installed package differs from its marketplace snapshot; preserve customizations before updating.",
      );
    const sourceType = settings.marketplace.source_type;
    if (
      sourceType === "git" &&
      settings.marketplace.source !== this.identity.source
    )
      throw new UpdateError(
        "UNSUPPORTED_SOURCE",
        "Marketplace repository differs from this updater target.",
      );
    let commit = null;
    if (sourceType === "git")
      commit = (
        await command(this.git, ["-C", market.root, "rev-parse", "HEAD"])
      ).trim();
    if (commit) await this.verifyGitSnapshot(market.root, commit, files);
    this.owned = { plugin: settings.plugin, marketplace: settings.marketplace };
    return {
      path: cached,
      files,
      version: installed.version,
      commit,
      configFile: settings.file,
      pluginSettings: settings.plugin,
      marketplaceSettings: settings.marketplace,
    };
  }
  async verifyGitSnapshot(folder, commit, files) {
    const tree = await command(this.git, [
      "-C",
      folder,
      "ls-tree",
      "-r",
      "-z",
      "--full-tree",
      commit,
    ]);
    const entries = tree
      .split("\0")
      .filter(Boolean)
      .map((record) => {
        const match =
          /^(100644|100755) blob ([a-f0-9]{40}|[a-f0-9]{64})\t([\s\S]+)$/.exec(
            record,
          );
        if (!match)
          throw new UpdateError(
            "UNSUPPORTED_SOURCE",
            "Only regular Git files are supported.",
          );
        return { name: match[3], oid: match[2] };
      });
    const changed = () =>
      new UpdateError(
        "LOCAL_CHANGES",
        "Installed package does not match its recorded Git commit; preserve customizations before updating.",
      );
    if (
      !equal(
        entries.map((entry) => entry.name).sort(),
        Object.keys(files).sort(),
      )
    )
      throw changed();
    for (const { name, oid } of entries) {
      const bytes = await fs.readFile(path.join(folder, name));
      const object = createHash(oid.length === 40 ? "sha1" : "sha256")
        .update(Buffer.from("blob " + bytes.length + "\0"))
        .update(bytes)
        .digest("hex");
      if (object !== oid || digest(bytes) !== files[name]) throw changed();
    }
  }
  async assertSettings(
    before,
    expectedMarketplace = before.marketplaceSettings,
  ) {
    const current = await this.settings();
    if (
      current.file !== before.configFile ||
      !equal(current.plugin, before.pluginSettings) ||
      !equal(current.marketplace, expectedMarketplace)
    )
      throw new UpdateError(
        "SETTINGS_CONFLICT",
        "Fable settings changed concurrently; refusing to overwrite them.",
      );
  }
  async stage(ref, backup) {
    if (!/^[A-Za-z0-9][A-Za-z0-9._\/-]{0,200}$/.test(ref))
      throw new UpdateError(
        "INVALID_REF",
        "Use a branch, tag or full commit ID.",
      );
    const folder = path.join(backup, "candidate");
    await fs.mkdir(folder);
    await command(this.git, ["init", "--quiet", folder]);
    await command(this.git, [
      "-C",
      folder,
      "remote",
      "add",
      "origin",
      this.identity.source,
    ]);
    await command(this.git, ["-C", folder, "fetch", "--quiet", "origin", ref]);
    await command(this.git, [
      "-C",
      folder,
      "checkout",
      "--quiet",
      "--detach",
      "FETCH_HEAD",
    ]);
    const commit = (
      await command(this.git, ["-C", folder, "rev-parse", "HEAD"])
    ).trim();
    const manifest = await this.validatePackage(folder);
    return {
      commit,
      version: manifest.version,
      files: await inventory(folder),
      sourceSettings: {
        source_type: "git",
        source: this.identity.source,
        ref: commit,
      },
    };
  }
  async validatePackage(folder) {
    const manifest = JSON.parse(
      await fs.readFile(path.join(folder, ".codex-plugin/plugin.json"), "utf8"),
    );
    const market = JSON.parse(
      await fs.readFile(
        path.join(folder, ".agents/plugins/marketplace.json"),
        "utf8",
      ),
    );
    if (
      manifest.name !== this.identity.plugin ||
      market.name !== this.identity.marketplace ||
      market.plugins?.length !== 1 ||
      market.plugins[0].name !== this.identity.plugin ||
      !equal(market.plugins[0].source, { source: "local", path: "./" }) ||
      manifest.skills !== "./.agents/skills/" ||
      manifest.mcpServers !== "./.mcp.json" ||
      !/^\d+\.\d+\.\d+$/.test(manifest.version)
    )
      throw new UpdateError("INVALID_PACKAGE", "Unexpected plugin manifest.");
    const info = JSON.parse(
      await fs.readFile(path.join(folder, "mcp/dist/build-info.json"), "utf8"),
    );
    const expectedInputs = [
      "build.mjs",
      "package.json",
      "package-lock.json",
      ...(await fs.readdir(path.join(folder, "mcp/src")))
        .filter((name) => name.endsWith(".mjs"))
        .map((name) => "src/" + name),
    ].sort();
    const expectedOutputs = [
      "dist/server.mjs",
      "dist/THIRD_PARTY_LICENSES.txt",
    ];
    if (
      await fs.stat(path.join(folder, "mcp/dist/update.mjs")).then(
        () => true,
        () => false,
      )
    )
      expectedOutputs.push("dist/update.mjs");
    if (
      !equal(Object.keys(info.inputs || {}).sort(), expectedInputs) ||
      !equal(Object.keys(info.outputs || {}).sort(), expectedOutputs.sort())
    )
      throw new UpdateError(
        "INVALID_PACKAGE",
        "Build inventory is incomplete.",
      );
    for (const [name, hash] of Object.entries({
      ...info.inputs,
      ...info.outputs,
    })) {
      if (path.isAbsolute(name) || name.split(/[\\/]/).includes(".."))
        throw new UpdateError("INVALID_PACKAGE", "Build path escapes package.");
      if (digest(await fs.readFile(path.join(folder, "mcp", name))) !== hash)
        throw new UpdateError(
          "INVALID_PACKAGE",
          "Build fingerprints do not match.",
        );
    }
    return manifest;
  }
  async guard() {
    const current = await this.settings();
    if (!this.owned)
      this.owned = { plugin: current.plugin, marketplace: current.marketplace };
    if (
      !equal(current.plugin, this.owned.plugin) ||
      !equal(current.marketplace, this.owned.marketplace)
    )
      throw new UpdateError(
        "SETTINGS_CONFLICT",
        "Fable settings changed concurrently.",
      );
    return current;
  }
  async setSettings(before, marketplace) {
    const current = await this.guard();
    if (current.file !== before.configFile)
      throw new UpdateError(
        "SETTINGS_CONFLICT",
        "User configuration path changed.",
      );
    await rpc(this.codex, "config/batchWrite", {
      filePath: current.file,
      expectedVersion: current.version,
      reloadUserConfig: false,
      edits: [
        {
          keyPath: "plugins." + JSON.stringify(this.identity.pluginId),
          value: before.pluginSettings,
          mergeStrategy: "replace",
        },
        {
          keyPath: "marketplaces." + JSON.stringify(this.identity.marketplace),
          value: marketplace,
          mergeStrategy: "replace",
        },
      ],
    });
    this.owned = { plugin: before.pluginSettings, marketplace };
    await this.assertSettings(before, marketplace);
  }
  async mutate(args, expected) {
    const current = await this.guard();
    const old = { plugin: current.plugin, marketplace: current.marketplace };
    let value, error;
    try {
      value = await this.cli(args, true);
    } catch (caught) {
      error = caught;
    }
    if (error?.code === "UNCERTAIN") throw error;
    const after = await this.settings();
    const actual = { plugin: after.plugin, marketplace: after.marketplace };
    if (!equal(actual, expected) && !(error && equal(actual, old)))
      throw new UpdateError(
        "SETTINGS_CONFLICT",
        "Unexpected settings change during native installation.",
      );
    this.owned = actual;
    if (error) throw error;
    return value;
  }
  async installSource(source, ref) {
    const list = await this.cli(["marketplace", "list"]);
    const current = await this.guard();
    if (list.marketplaces.some((m) => m.name === this.identity.marketplace))
      await this.mutate(["marketplace", "remove", this.identity.marketplace], {
        plugin: current.plugin,
        marketplace: null,
      });
    const expectedMarket = ref
      ? { source_type: "git", source, ref }
      : {
          source_type: "local",
          source: path.toNamespacedPath(path.resolve(source)),
        };
    await this.mutate(
      ["marketplace", "add", source, ...(ref ? ["--ref", ref] : [])],
      { plugin: current.plugin, marketplace: expectedMarket },
    );
    const installed = await this.mutate(["add", this.identity.pluginId], {
      plugin: { ...current.plugin, enabled: true },
      marketplace: expectedMarket,
    });
    if (!installed.installedPath)
      throw new UpdateError(
        "INSTALL_FAILED",
        "Native installer returned no path.",
      );
    return { path: installed.installedPath, version: installed.version };
  }
  async install(candidate, before) {
    const installed = await this.installSource(
      this.identity.source,
      candidate.commit,
    );
    await this.setSettings(before, candidate.sourceSettings);
    if (installed.version !== candidate.version)
      throw new UpdateError(
        "WRONG_VERSION",
        "Installed version differs from the candidate.",
      );
    return installed;
  }
  async restore(before, backup) {
    let installed, settings, sourceMode;
    try {
      if (!before.commit)
        throw new UpdateError(
          "LOCAL_SOURCE",
          "Use the local recovery snapshot.",
        );
      installed = await this.installSource(this.identity.source, before.commit);
      if (!equal(await inventory(installed.path), before.files))
        throw new UpdateError(
          "RESTORE_MISMATCH",
          "Git copy differs from the saved package; use the verified local snapshot.",
        );
      settings = {
        ...before.marketplaceSettings,
        source_type: "git",
        source: this.identity.source,
        ref: before.commit,
      };
      sourceMode = "pinned_git";
    } catch (error) {
      if (["UNCERTAIN", "SETTINGS_CONFLICT"].includes(error.code)) throw error;
      const folder = path.join(backup, "package");
      try {
        installed = await this.installSource(folder, null);
      } catch (localError) {
        if (localError.code !== "CACHE_BUSY") throw localError;
        // Windows can retain the old version directory as a live MCP process cwd.
        // Install identical code in a fresh native version slot; never kill that process.
        const recovery = path.join(backup, "recovery-" + randomUUID());
        await copyPackage(folder, recovery, before.files);
        const file = path.join(recovery, ".codex-plugin/plugin.json");
        const manifest = JSON.parse(await fs.readFile(file, "utf8"));
        manifest.version =
          before.version.split("+")[0] +
          "+recovery." +
          randomUUID().replaceAll("-", "");
        await fs.writeFile(file, JSON.stringify(manifest, null, 2) + "\n");
        const files = await inventory(recovery);
        installed = await this.installSource(recovery, null);
        if (installed.version !== manifest.version)
          throw new UpdateError(
            "RESTORE_FAILED",
            "Recovery version slot differs.",
          );
        settings = { ...this.owned.marketplace };
        sourceMode = "local_recovery";
        await this.setSettings(before, settings);
        return {
          ...installed,
          version: before.version,
          installedVersion: manifest.version,
          files,
          sourceMode,
          sourceSettings: settings,
        };
      }
      settings = { ...this.owned.marketplace };
      sourceMode = "local_backup";
    }
    await this.setSettings(before, settings);
    if (installed.version !== before.version)
      throw new UpdateError(
        "RESTORE_FAILED",
        "Previous version was not restored.",
      );
    return { ...installed, sourceMode, sourceSettings: settings };
  }
  async health(installed, project, files) {
    if (!equal(await inventory(installed.path), files))
      throw new UpdateError(
        "HEALTH_FAILED",
        "Installed files differ from the expected package.",
      );
    const native = await fetchNativeCatalog(project, { command: this.codex });
    const own = native.data
      .flatMap((entry) => entry.skills)
      .find(
        (skill) => skill.pluginId === this.identity.pluginId && skill.enabled,
      );
    if (
      !own ||
      !path
        .resolve(own.path)
        .startsWith(path.resolve(installed.path) + path.sep)
    )
      throw new UpdateError(
        "HEALTH_FAILED",
        "Codex did not load the installed skill.",
      );
    const config = JSON.parse(
      await fs.readFile(path.join(installed.path, ".mcp.json"), "utf8"),
    );
    const spec = config.mcpServers?.[this.identity.server];
    if (
      !spec ||
      spec.command !== "node" ||
      spec.cwd !== "./" ||
      !equal(spec.args, ["mcp/dist/server.mjs"])
    )
      throw new UpdateError(
        "HEALTH_FAILED",
        "Unexpected MCP launch configuration.",
      );
    const env = getDefaultEnvironment();
    env.FABLE5_CODEX_BIN = this.codex;
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: [path.join(installed.path, "mcp/dist/server.mjs")],
      cwd: project,
      env,
      stderr: "pipe",
    });
    transport.stderr.on("data", () => {});
    const client = new Client({
      name: "fable5-safe-update-health",
      version: "0.1.0",
    });
    const unpack = (result) => {
      if (result.isError)
        throw new UpdateError("HEALTH_FAILED", "MCP returned an error.");
      return JSON.parse(result.content[0].text);
    };
    let timer;
    const probe = async () => {
      await client.connect(transport);
      const tools = await client.listTools();
      if (
        !["search_skills", "read_skill"].every((name) =>
          tools.tools.some((tool) => tool.name === name),
        )
      )
        throw new UpdateError("HEALTH_FAILED", "MCP tools missing.");
      const found = unpack(
        await client.callTool({
          name: "search_skills",
          arguments: { query: "fable5-codex", cwd: project },
        }),
      );
      const skill = found.skills.find(
        (s) => s.plugin_id === this.identity.pluginId,
      );
      if (!skill || found.partial)
        throw new UpdateError(
          "HEALTH_FAILED",
          "MCP did not find the installed skill in a complete catalogue.",
        );
      const read = unpack(
        await client.callTool({
          name: "read_skill",
          arguments: { cwd: project, skill_id: skill.id },
        }),
      );
      if (!read.content.includes("name: fable5-codex") || !read.sha256)
        throw new UpdateError("HEALTH_FAILED", "MCP skill read did not match.");
    };
    try {
      await Promise.race([
        probe(),
        new Promise((_, reject) => {
          timer = setTimeout(
            () =>
              reject(
                new UpdateError(
                  "HEALTH_TIMEOUT",
                  "MCP health check timed out.",
                ),
              ),
            20000,
          );
        }),
      ]);
    } finally {
      clearTimeout(timer);
      await client.close();
    }
  }
}
