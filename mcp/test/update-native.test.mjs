import assert from "node:assert/strict";
import { test } from "node:test";
import * as fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { NativeBackend, command } from "../src/update-native.mjs";
import {
  inventory,
  copyPackage,
  equal,
  UpdateError,
} from "../src/update-core.mjs";

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
  assert.equal(
    (await backend.validatePackage(temp)).version,
    JSON.parse(
      await fs.readFile(path.join(root, ".codex-plugin/plugin.json"), "utf8"),
    ).version,
  );
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

async function gitFixture(t) {
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), "fable5-git-review-"));
  t.after(async () => {
    const resolved = await fs.realpath(temp),
      base = await fs.realpath(os.tmpdir());
    assert.equal(path.dirname(resolved), base);
    assert.ok(path.basename(resolved).startsWith("fable5-git-review-"));
    await fs.rm(resolved, { recursive: true, force: true });
  });
  const market = path.join(temp, "market"),
    cache = path.join(temp, "profile/plugins/cache/fable5/fable5-codex/1.3.1");
  await fs.mkdir(path.join(market, ".codex-plugin"), { recursive: true });
  await fs.writeFile(
    path.join(market, ".codex-plugin/plugin.json"),
    JSON.stringify({ name: "fable5-codex", version: "1.3.1" }),
  );
  await fs.writeFile(path.join(market, "source.txt"), "original\n");
  await fs.writeFile(
    path.join(market, "asset.bin"),
    Buffer.from([0, 255, 13, 10]),
  );
  await command("git", ["init", "--quiet", market]);
  await command("git", ["-C", market, "add", "."]);
  await command("git", [
    "-C",
    market,
    "-c",
    "user.name=Review Fixture",
    "-c",
    "user.email=fixture@example.invalid",
    "commit",
    "--quiet",
    "-m",
    "baseline",
  ]);
  await copyPackage(market, cache, await inventory(market));
  const backend = new NativeBackend();
  backend.settings = async () => ({
    file: path.join(temp, "profile/config.toml"),
    plugin: { enabled: true },
    marketplace: {
      source_type: "git",
      source: backend.identity.source,
      ref: "main",
    },
  });
  backend.cli = async (args) =>
    args[0] === "list"
      ? {
          installed: [
            {
              pluginId: backend.identity.pluginId,
              installed: true,
              enabled: true,
              version: "1.3.1",
            },
          ],
        }
      : { marketplaces: [{ name: "fable5", root: market }] };
  return { temp, market, cache, backend };
}

test("clean Git package including binary blobs is accepted", async (t) => {
  const f = await gitFixture(t),
    before = await f.backend.inspect();
  assert.match(before.commit, /^[a-f0-9]{40}$/);
  assert.equal(Object.keys(before.files).length, 3);
});

async function nativeMarketplaceMetadata(f, overrides = {}) {
  const settings = await f.backend.settings();
  return {
    source_type: "git",
    source: f.backend.identity.source,
    ref_name: settings.marketplace.ref,
    sparse_paths: [],
    revision: (await command("git", ["-C", f.market, "rev-parse", "HEAD"])).trim(),
    ...overrides,
  };
}

test("validated native Git marketplace bookkeeping is not plugin content", async (t) => {
  const f = await gitFixture(t);
  await fs.writeFile(
    path.join(f.market, ".codex-marketplace-install.json"),
    JSON.stringify(await nativeMarketplaceMetadata(f)),
  );
  const before = await f.backend.inspect();
  assert.equal(Object.keys(before.files).length, 3);
  assert.equal(before.files[".codex-marketplace-install.json"], undefined);
});

for (const [name, overrides] of [
  ["source", { source: "https://example.invalid/other.git" }],
  ["type", { source_type: "local" }],
  ["ref", { ref_name: "other-branch" }],
  ["ref shape", { ref_name: 12 }],
  ["revision", { revision: "0".repeat(40) }],
  ["sparse paths", { sparse_paths: [".agents"] }],
  ["sparse shape", { sparse_paths: null }],
  ["extra field", { extra: true }],
])
  test("native marketplace metadata rejects mismatched " + name, async (t) => {
    const f = await gitFixture(t);
    await fs.writeFile(
      path.join(f.market, ".codex-marketplace-install.json"),
      JSON.stringify(await nativeMarketplaceMetadata(f, overrides)),
    );
    await assert.rejects(f.backend.inspect(), { code: "LOCAL_CHANGES" });
  });

for (const value of ["{broken", "null", "[]", "{}"])
  test("invalid native marketplace JSON is rejected: " + value, async (t) => {
    const f = await gitFixture(t);
    await fs.writeFile(path.join(f.market, ".codex-marketplace-install.json"), value);
    await assert.rejects(f.backend.inspect(), { code: "LOCAL_CHANGES" });
  });

test("tracked marketplace bookkeeping filename cannot receive an exemption", async (t) => {
  const f = await gitFixture(t);
  const name = ".codex-marketplace-install.json";
  await fs.writeFile(path.join(f.market, name), "tracked package content");
  await command("git", ["-C", f.market, "add", name]);
  await command("git", ["-C", f.market, "-c", "user.name=Review Fixture", "-c",
    "user.email=fixture@example.invalid", "commit", "--quiet", "-m", "track metadata name"]);
  await fs.writeFile(path.join(f.market, name), JSON.stringify(await nativeMarketplaceMetadata(f)));
  await assert.rejects(f.backend.inspect(), { code: "LOCAL_CHANGES" });
});

for (const location of ["cache", "nested", "other"])
  test("native metadata exemption does not hide " + location + " files", async (t) => {
    const f = await gitFixture(t);
    const name = ".codex-marketplace-install.json";
    const metadata = JSON.stringify(await nativeMarketplaceMetadata(f));
    await fs.writeFile(path.join(f.market, name), metadata);
    if (location === "cache") await fs.writeFile(path.join(f.cache, name), metadata);
    if (location === "nested") {
      await fs.mkdir(path.join(f.market, "nested"));
      await fs.writeFile(path.join(f.market, "nested", name), metadata);
    }
    if (location === "other") await fs.writeFile(path.join(f.market, ".ignored-extra"), "extra");
    await assert.rejects(f.backend.inspect(), { code: "LOCAL_CHANGES" });
  });

for (const change of ["modified", "assume-unchanged", "untracked", "deleted"])
  test(
    "matching marketplace/cache " + change + " cannot masquerade as Git HEAD",
    async (t) => {
      const f = await gitFixture(t);
      if (change === "assume-unchanged")
        await command("git", [
          "-C",
          f.market,
          "update-index",
          "--assume-unchanged",
          "source.txt",
        ]);
      for (const folder of [f.market, f.cache]) {
        if (change === "deleted")
          await fs.unlink(path.join(folder, "source.txt"));
        else
          await fs.writeFile(
            path.join(
              folder,
              change === "untracked" ? "extra.txt" : "source.txt",
            ),
            "customized\n",
          );
      }
      await assert.rejects(f.backend.inspect(), { code: "LOCAL_CHANGES" });
    },
  );

test("legacy customized backup falls back locally when Git install succeeds with different bytes", async (t) => {
  const f = await gitFixture(t);
  const original = await f.backend.inspect();
  const packageRoot = path.join(f.temp, "package");
  await copyPackage(f.cache, packageRoot, original.files);
  await fs.writeFile(
    path.join(packageRoot, "source.txt"),
    "customized snapshot\n",
  );
  const before = { ...original, files: await inventory(packageRoot) };
  const sources = [];
  f.backend.installSource = async (source, ref) => {
    sources.push(ref ? "git" : "local");
    f.backend.owned = {
      marketplace: {
        source_type: ref ? "git" : "local",
        source,
        ...(ref ? { ref } : {}),
      },
    };
    return { version: "1.3.1", path: ref ? f.cache : packageRoot };
  };
  f.backend.setSettings = async () => {};
  const restored = await f.backend.restore(before, f.temp);
  assert.deepEqual(sources, ["git", "local"]);
  assert.equal(restored.sourceMode, "local_backup");
  assert.ok(equal(await inventory(restored.path), before.files));
});
