import { build } from "esbuild";
import * as fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const root = path.dirname(fileURLToPath(import.meta.url));
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
await fs.mkdir(path.join(root, "dist"), { recursive: true });
await build({
  absWorkingDir: root,
  entryPoints: ["src/main.mjs"],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "esm",
  minify: true,
  legalComments: "eof",
  outfile: "dist/server.mjs",
});
await build({
  absWorkingDir: root,
  entryPoints: ["src/update-main.mjs"],
  banner: {
    js: 'import { createRequire } from "node:module"; const require = createRequire(import.meta.url);',
  },
  bundle: true,
  platform: "node",
  target: "node20",
  format: "esm",
  minify: true,
  legalComments: "eof",
  outfile: "dist/update.mjs",
});
const packages = [
  "@modelcontextprotocol/server",
  "@modelcontextprotocol/core",
  "@modelcontextprotocol/client",
  "cross-spawn",
  "path-key",
  "shebang-command",
  "shebang-regex",
  "which",
  "isexe",
  "zod",
];
const notices = [];
for (const name of packages) {
  const directory = path.join(root, "node_modules", name);
  const metadata = JSON.parse(
    await fs.readFile(path.join(directory, "package.json"), "utf8"),
  );
  const license = await fs.readFile(path.join(directory, "LICENSE"), "utf8");
  notices.push(`${name} ${metadata.version}\n${license}`);
}
await fs.writeFile(
  path.join(root, "dist/THIRD_PARTY_LICENSES.txt"),
  notices.join("\n\n"),
  "utf8",
);
const names = [
  "build.mjs",
  "package.json",
  "package-lock.json",
  ...(await fs.readdir(path.join(root, "src")))
    .sort()
    .map((name) => "src/" + name),
];
const inputs = {};
for (const name of names)
  inputs[name] = hash(await fs.readFile(path.join(root, name)));
const outputs = {};
for (const name of [
  "dist/server.mjs",
  "dist/update.mjs",
  "dist/THIRD_PARTY_LICENSES.txt",
])
  outputs[name] = hash(await fs.readFile(path.join(root, name)));
await fs.writeFile(
  path.join(root, "dist/build-info.json"),
  JSON.stringify({ inputs, outputs }, null, 2) + "\n",
);
console.error("Built self-contained MCP server and license notices.");
