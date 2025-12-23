import { readFile } from "fs/promises";
/**
 * Reads a file and returns its content.
 * @param {Object} params - Parameters for the tool.
 * @returns {Promise<Object>} Result object.
 */
export default async function readFileTool(params = {}) {
    if (!params.path) throw new Error("Missing 'path' parameter");
    const content = await readFile(params.path, "utf8");
    return { content };
}