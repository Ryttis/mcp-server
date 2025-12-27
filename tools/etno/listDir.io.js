import path from "path";
import { listDir as baseListDir } from "../../src/utils/fs/listDir.js";
import { ToolError } from "../../errors/ToolError.js";
import { LIMITS } from "../../config/limits.js";

/**
 * IO layer for etno.listDir tool.
 * Handles env access, path safety, and bounded filesystem listing.
 */
export const listDirIO = {
    getRoot() {
        return process.env.ETNOLENTOS_PATH;
    },

    resolve(p) {
        return path.resolve(p);
    },

    relative(from, to) {
        return path.relative(from, to);
    },

    safeJoin(root, relPath = "") {
        const joined = path.join(root, relPath || "");
        const normalizedRoot = path.resolve(root);
        const resolved = path.resolve(joined);
        if (!resolved.startsWith(normalizedRoot)) {
            throw new ToolError(
                "PATH_ESCAPE",
                "Path escapes ETNOLENTOS_PATH",
                { root: normalizedRoot, resolved }
            );
        }
        return resolved;
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
