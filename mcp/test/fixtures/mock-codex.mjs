// Simulates only the native catalogue transport; it is never a production data source.
import { createInterface } from "node:readline";
import { writeFile } from "node:fs/promises";
const mode = process.argv[2];
if (process.argv[3]) await writeFile(process.argv[3], String(process.pid));
const lines = createInterface({ input: process.stdin });
for await (const line of lines) {
  const request = JSON.parse(line);
  if (request.method === "initialize") {
    process.stdout.write(JSON.stringify({ id: 1, result: {} }) + "\n");
  } else if (request.method === "skills/list") {
    if (mode === "timeout") continue;
    if (mode === "bad-json") {
      process.stdout.write("not-json\n");
      continue;
    }
    if (mode === "error") {
      process.stdout.write('{"id":2,"error":{"code":-1}}\n');
      continue;
    }
    if (mode === "large") {
      process.stdout.write("x".repeat(2000) + "\n");
      continue;
    }
    process.stdout.write(
      JSON.stringify({
        id: 2,
        result: {
          data: [{ cwd: request.params.cwds[0], skills: [], errors: [] }],
        },
      }) + "\n",
    );
  }
}
