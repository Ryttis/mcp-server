import path from "path";
import { listDir as baseListDir } from "../../src/utils/fs/listDir.js";

/**
 * Etno Lentos directory lister
 * Recursively enumerates design/material files inside ETNOLENTOS_PATH.
 *
 * Params:
 * @param {Object} params
 * @param {string} [params.dir=""] - Relative subdirectory to start from.
 * @param {boolean} [params.recursive=false] - Whether to list nested folders.
 * @param {string[]} [params.exts=null] - Optional file extensions filter.
 * @param {number} [params.max=500] - Maximum number of items to return.
 *
 * @returns {Promise<Object>} Directory listing result.
 */
function safeJoin(root, relPath = "") {
    const joined = path.join(root, relPath || "");
    const normalizedRoot = path.resolve(root);
    const resolved = path.resolve(joined);
    if (!resolved.startsWith(normalizedRoot)) {
        throw new Error("Path escapes ETNOLENTOS_PATH");
    }
    return resolved;
}

export default async function listDirTool(params = {}) {
    const root = process.env.ETNOLENTOS_PATH;
    if (!root) throw new Error("ETNOLENTOS_PATH not set");

    const { dir = "", recursive = false, exts = null, max = 500 } = params;
    const rootAbs = path.resolve(root);
    const start = safeJoin(rootAbs, dir);

    const out = [];
    const queue = [start];

    while (queue.length && out.length < max) {
        const current = queue.shift();
        const entries = await baseListDir(current);

        for (const item of entries) {
            if (out.length >= max) break;

            const relFromRoot = path.relative(rootAbs, item.fullPath);

            const record = { ...item, relPath: relFromRoot };

            if (exts && !item.isDir) {
                const ok = exts.map((x) => x.toLowerCase()).includes(item.ext);
                if (!ok) continue;
            }

            out.push(record);

            if (recursive && item.isDir) {
                queue.push(item.fullPath);
            }
        }
    }

    return {
        root: rootAbs,
        startDir: path.relative(rootAbs, start) || ".",
        total: out.length,
        truncated: out.length >= max,
        items: out,
    };
}
