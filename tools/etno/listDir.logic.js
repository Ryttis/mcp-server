/**
 * Pure logic for etno.listDir tool.
 * Traverses directories, applies filters, and shapes output.
 */
export async function listDirLogic(params = {}, io) {
    const root = io.getRoot();
    if (!root) throw new Error("ETNOLENTOS_PATH not set");

    const { dir = "", recursive = false, exts = null, max = 500 } = params;

    const rootAbs = io.resolve(root);
    const start = io.safeJoin(rootAbs, dir);

    const out = [];
    const queue = [start];

    while (queue.length && out.length < max) {
        const current = queue.shift();
        const entries = await io.list(current);

        for (const item of entries) {
            if (out.length >= max) break;

            const relFromRoot = io.relative(rootAbs, item.fullPath);
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
        startDir: io.relative(rootAbs, start) || ".",
        total: out.length,
        truncated: out.length >= max,
        items: out,
    };
}
