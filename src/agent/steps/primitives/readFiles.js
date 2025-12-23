/**
 * Primitive Step: readFiles (v1)
 *
 * Reads selected files from disk and stores their content into context.filesContent.
 */

import fs from "fs/promises";
import path from "path";
import { logStep, logError } from "../../logging/logger.js";

export async function run(context) {
    const root = context.options.rootPath;
    const files = context.selectedFiles || [];

    logStep(context, "readFiles", `Reading ${files.length} file(s) from disk`);

    const map = {};

    for (const file of files) {
        try {
            const absPath = path.isAbsolute(file)
                ? file
                : path.join(root, file);

            const content = await fs.readFile(absPath, "utf8");

            map[file] = content;

        } catch (err) {
            logError(context, `Failed to read '${file}': ${err.message}`);
        }
    }

    return {
        mutations: {
            filesContent: map
        }
    };
}
