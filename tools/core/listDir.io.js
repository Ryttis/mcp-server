import path from "path";
import { listDir as baseListDir } from "../../src/utils/fs/listDir.js";
import { ToolError } from "../../errors/ToolError.js";
import { LIMITS } from "../../config/limits.js";

/**
 * IO layer for core.listDir tool.
 * Handles bounded filesystem listing.
 */
export const listDirIO = {
    resolve(p) {
        return path.resolve(p);
    },

    relative(from, to) {
        return path.relative(from, to);
    },

    async list(dir, depth = 0, counter = { count: 0 }) {
        if (depth > LIMITS.MAX_DIR_DEPTH) {
            throw new ToolError(
                "DIR_LIMIT_EXCEEDED",
                `Max directory depth ${LIMITS.MAX_DIR_DEPTH} exceeded`,
                { depth }
            );
        }

        const entries = await baseListDir(dir);

        counter.count += entries.length;
        if (counter.count > LIMITS.MAX_DIR_ENTRIES) {
            throw new ToolError(
                "DIR_LIMIT_EXCEEDED",
                `Max directory entries ${LIMITS.MAX_DIR_ENTRIES} exceeded`,
                { count: counter.count }
            );
        }

        return entries;
    }
};
