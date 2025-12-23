/**
 * Reads a factura file and returns its metadata.
 * @param {Object} params - Parameters for the tool.
 * @param {string} params.file - The file name to be read.
 * @returns {Promise<Object>} Result object.
 * @example
 * { "id": 1, "method": "core_readFacturaFile", "params": { "file": "invoice.txt" } }
 */

import fs from "fs/promises";
import path from "path";

export default async function readFacturaFile(params = {}) {
    const root = process.env.FACTURACORE_PATH;
    if (!root) throw new Error("FACTURACORE_PATH not set");

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