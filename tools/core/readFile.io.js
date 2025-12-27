import fs from "fs/promises";
import { ToolError } from "../../errors/ToolError.js";
import { LIMITS } from "../../config/limits.js";

/**
 * IO layer for readFile tool.
 * Handles filesystem reads with size guard.
 */
export const readFileIO = {
    async read(filePath) {
        const stat = await fs.stat(filePath);

        if (stat.size > LIMITS.MAX_FILE_SIZE) {
            throw new ToolError(
                "FILE_TOO_LARGE",
                `File exceeds max size of ${LIMITS.MAX_FILE_SIZE} bytes`,
                { size: stat.size, max: LIMITS.MAX_FILE_SIZE }
            );
        }

        return fs.readFile(filePath, "utf8");
    }
};
