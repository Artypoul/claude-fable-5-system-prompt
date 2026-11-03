// SDK protocol fixture: real tools and file reads, isolated native catalogue data.
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fetchNativeCatalog } from "../../src/catalog.mjs";
import { startServer } from "../../src/server.mjs";
startServer({
  catalogReader: async (cwd, { signal }) => {
    if (path.basename(cwd).startsWith("fable5-cancel-"))
      return fetchNativeCatalog(cwd, {
        signal,
        command: process.execPath,
        args: [
          fileURLToPath(new URL("./mock-codex.mjs", import.meta.url)),
          "timeout",
          path.join(cwd, "child.pid"),
        ],
      });
    return {
      data: [
        {
          cwd,
          errors: [],
          skills: [
            {
              name: "sample:pdf",
              description: "Read and create PDF",
              enabled: true,
              scope: "repo",
              pluginId: "sample@test",
              path: path.join(cwd, "SKILL.md"),
            },
            {
              name: "disabled:pdf",
              description: "Old PDF skill",
              enabled: false,
              scope: "user",
              pluginId: "old@test",
              path: path.join(cwd, "old", "SKILL.md"),
            },
          ],
        },
      ],
    };
  },
});
