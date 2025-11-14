import fs from "fs/promises";
import path from "path";

export default async function readEtnoFile(params = {}) {
    const root = process.env.ETNOLENTOS_PATH;
    if (!root) throw new Error("ETNOLENTOS_PATH not set");

    const { file } = params;
    if (!file) throw new Error("Missing 'file' param");

    const absPath = path.resolve(root, file);
    const content = await fs.readFile(absPath, "utf8");

    return {
        path: absPath,
        size: content.length,
        preview: content.substring(0, 200),
    };
}
