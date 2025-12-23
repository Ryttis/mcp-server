import { writeFile } from "fs/promises";

/**
 * Writes content to a file at the specified path.
 * @param {Object} params - Parameters for the tool.
 * @param {string} params.path - The path of the file to write.
 * @param {string} params.content - The content to write to the file.
 * @returns {Promise<Object>} Result object.
 * @example
 * { "id": 1, "method": "core_writeFileTool", "params": { "path": "example.txt", "content": "Hello, World!" } }
 */
export default async function writeFileTool(params = {}) {
    const { path, content } = params;
    if (!path || typeof content !== "string") throw new Error("Missing path or content");
    await writeFile(path, content, "utf8");
    return { message: `File ${path} written.` };
}