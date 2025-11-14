import { readFile } from "fs/promises";
import path from "path";

/**
 * Reads a file from the FacturaCore project directory.
 * Params:
 *  - file: string (relative path inside FacturaCore)
 */
export default async function readProjectFile(params = {}) {
    if (!process.env.FACTURACORE_PATH) throw new Error("Missing FACTURACORE_PATH");
    if (!params.file) throw new Error("Missing 'file' parameter");

    const filePath = path.join(process.env.FACTURACORE_PATH, params.file);
    const content = await readFile(filePath, "utf8");

    return {
        path: filePath,
        size: content.length,
        content
    };
}
