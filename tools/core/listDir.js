import { listDir } from "../../src/utils/fs/listDir.js";

/**
 * RPC tool wrapper for listing directory contents.
 * @param {Object} params - Parameters for the tool.
 * @param {string} params.path - Directory to list.
 * @returns {Promise<Object>} Object with files array.
 * @example
 * { "id": 1, "method": "core_listDirTool", "params": { "path": "/path/to/directory" } }
 */
export default async function listDirTool(params = {}) {
    const basePath = params.path || process.cwd();
    const files = await listDir(basePath);
    return { files };
}