import path from "node:path";
import { fileURLToPath } from "node:url";
import { runUpdate, runRollback, UpdateError } from "./update-core.mjs";
import { NativeBackend } from "./update-native.mjs";

const usage =
  "Usage: node update.mjs update --project ABSOLUTE_PATH [--ref main]\n" +
  "       node recover.mjs rollback --project ABSOLUTE_PATH --backup ABSOLUTE_PATH";
try {
  const args = process.argv.slice(2);
  if (args.length === 1 && ["--help", "-h"].includes(args[0])) {
    console.log(usage);
  } else {
    const action = args.shift(),
      options = {};
    const invalid = () => {
      throw new UpdateError("INVALID_ARGUMENTS", usage);
    };
    if (!["update", "rollback"].includes(action)) invalid();
    while (args.length) {
      const key = args.shift(),
        value = args.shift();
      if (
        !["--project", "--ref", "--backup"].includes(key) ||
        !value ||
        value.startsWith("--") ||
        Object.hasOwn(options, key.slice(2))
      )
        invalid();
      options[key.slice(2)] = value;
    }
    if (
      !options.project ||
      !path.isAbsolute(options.project) ||
      (action === "update" && options.backup) ||
      (action === "rollback" &&
        (options.ref || !options.backup || !path.isAbsolute(options.backup)))
    )
      invalid();
    const backend = new NativeBackend();
    await backend.preflightProject(options.project);
    const settings = await backend.settings();
    // Native installation may prune the old cache, including the launch directory.
    process.chdir(path.dirname(settings.file));
    const result =
      action === "update"
        ? await runUpdate(backend, {
            project: options.project,
            ref: options.ref || "main",
            runner: fileURLToPath(import.meta.url),
          })
        : await runRollback(backend, {
            project: options.project,
            backup: options.backup,
          });
    console.log(JSON.stringify(result, null, 2));
    process.exitCode =
      result.status === "updated" ? 0 : result.status === "rolled_back" ? 2 : 3;
  }
} catch (error) {
  console.error(
    JSON.stringify({
      status: "failed",
      error_code: error.code || "UPDATE_FAILED",
      message:
        error instanceof UpdateError
          ? error.message
          : "Update failed; no success is claimed.",
    }),
  );
  process.exitCode = 3;
}
