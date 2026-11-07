import { McpServer } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import * as z from "zod/v4";
import {
  CatalogError,
  fetchConfiguredCatalog,
  parseCatalog,
  projectDirectory,
  readRegisteredSkill,
  sha256,
} from "./catalog.mjs";
import { searchSkills } from "./search.mjs";

const annotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
};
const cwdSchema = z
  .string()
  .min(1)
  .max(32768)
  .describe(
    "Existing absolute project directory, from the active task context; not the plugin directory.",
  );
const result = (data) => ({
  content: [{ type: "text", text: JSON.stringify(data) }],
  structuredContent: data,
});

export function createServer({ catalogReader = fetchConfiguredCatalog } = {}) {
  const server = new McpServer({ name: "fable5_skills", version: "0.1.0" });
  const load = async (cwd, signal) => {
    const directory = await projectDirectory(cwd);
    return parseCatalog(await catalogReader(directory, { signal }), directory);
  };
  const handle = (fn) => async (input, context) => {
    try {
      return result(await fn(input, context?.mcpReq?.signal));
    } catch (error) {
      const known = error instanceof CatalogError;
      return {
        ...result({
          error: {
            code: known ? error.code : "INTERNAL_ERROR",
            message: known
              ? error.message
              : "Skill lookup failed unexpectedly.",
          },
        }),
        isError: true,
      };
    }
  };
  server.registerTool(
    "search_skills",
    {
      description:
        "Find enabled installed Codex skills by name and description for a project. Empty query browses the catalogue. Read returned skill IDs with read_skill. Lexical matching; no web search, installation or execution.",
      inputSchema: z
        .object({
          query: z.string().max(512),
          cwd: cwdSchema,
          limit: z.number().int().min(1).max(50).default(10),
          offset: z.number().int().min(0).max(1_000_000).default(0),
        })
        .strict(),
      annotations,
    },
    handle(async ({ query, cwd, limit, offset }, signal) => {
      const catalog = await load(cwd, signal);
      return {
        ...searchSkills(catalog.skills, query, limit, offset),
        partial: catalog.partial,
        warning_count: catalog.warning_count,
        catalog_sha256: sha256(
          JSON.stringify(
            [...catalog.skills].sort((a, b) => a.id.localeCompare(b.id)),
          ),
        ),
      };
    }),
  );
  server.registerTool(
    "read_skill",
    {
      description:
        "Read a currently enabled registered SKILL.md by the opaque ID returned by search_skills, in the same project. Returns text only; does not execute it, grant permissions or activate a native skill. Offsets count Unicode code points.",
      inputSchema: z
        .object({
          cwd: cwdSchema,
          skill_id: z.string().regex(/^[a-f0-9]{64}$/),
          offset: z.number().int().min(0).max(1_048_576).default(0),
          limit: z.number().int().min(1).max(32000).default(16000),
        })
        .strict(),
      annotations,
    },
    handle(async ({ cwd, skill_id, offset, limit }, signal) =>
      readRegisteredSkill(await load(cwd, signal), skill_id, offset, limit),
    ),
  );
  return server;
}

export function startServer(options) {
  const handle = serveStdio(() => createServer(options));
  process.once("SIGINT", () => void handle.close());
  process.once("SIGTERM", () => void handle.close());
  return handle;
}
