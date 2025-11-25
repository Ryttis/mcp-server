/**
 * Primitive Step: writeFiles (v1)
 *
 * Writes validated file content back to disk (or via MCP when implemented).
 * For each file:
 *   1. Check validationResults[file] === true
 *   2. Create a .bak backup beside original
 *   3. Write validatedOutputs[file] to disk
 */

import fs from "fs";
import path from "path";
import { logStep, logError } from "../../logging/logger.js";

/**
 * @param {object} context
 * @returns {Promise<object>}
 */
export async function run(context) {
    const validated = context.validationResults || {};
    const outputs = context.validatedOutputs || {};
    const root = context.options.rootPath;

    const updated = [];
    const backups = [];

    logStep(context, "writeFiles", "Writing validated files…");

    for (const file of Object.keys(outputs)) {
        const isValid = validated[file];
        const absPath = path.resolve(root, file);
        const bakPath = absPath + ".bak";
        const content = outputs[file];

        // If validation failed — skip
        if (!isValid) {
            logError(context, `Refusing to write '${file}': validation failed.`);
            continue;
        }

        try {
            // Write backup
            await fs.promises.writeFile(bakPath, context.filesContent[file], "utf8");
            backups.push(bakPath);

            // Write updated file
            await fs.promises.writeFile(absPath, content, "utf8");
            updated.push(absPath);

            logStep(context, "writeFiles", `Wrote ${file} (+ backup)`);

        } catch (err) {
            logError(context, `Failed to write '${file}': ${err?.message || err}`);
        }
    }

    return {
        mutations: {
            backupFiles: backups,
            updatedFiles: updated
        }
    };
}
