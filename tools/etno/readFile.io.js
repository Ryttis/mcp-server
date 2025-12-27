import fs from "fs/promises";
import path from "path";
import { ToolError } from "../../errors/ToolError.js";
import { LIMITS } from "../../config/limits.js";

/**
 * IO layer for etno.readFile tool.
 * Handles env access, path resolution and filesystem reads with size guard.
 */
export const readEtnoFileIO = {
    getRoot() {
        return process.env.ETNOLENTOS_PATH;
    },

    resolvePath(root, file) {
        return path.resolve(root, file);
    },

    async read(absPath) {
        const stat = await fs.stat(absPath);

        if (stat.size > LIMITS.MAX_FILE_SIZE) {
            throw new ToolError(
                "FILE_TOO_LARGE",
                `File exceeds max size of ${LIMITS.MAX_FILE_SIZE} bytes`,
                { size: stat.size, max: LIMITS.MAX_FILE_SIZE }
            );
        }

        return fs.readFile(absPath, "utf8");
    }
};
