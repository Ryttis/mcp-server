/**
 * Caches key-value pairs in a JSON file.
 * @param {Object} params - Parameters for the tool.
 * @param {string} params.path - File path or similar input.
 * @returns {Promise<Object>} Result object.
 * @example
 * { "id": 1, "method": "core_<toolName>", "params": { "path": "example.txt" } }
 */
import { readFile, writeFile } from "fs/promises";
const CACHE_FILE = "./cache.json";

export default async function cacheTool(params = {}) {
    const { action, key, value } = params;

    if (!action || !key) throw new Error("Missing action or key");

    let cache = {};
    try {
        const content = await readFile(CACHE_FILE, "utf8");
        cache = JSON.parse(content || "{}");
    } catch {
        cache = {};
    }

    if (action === "get") {
        return { value: cache[key] ?? null };
    }

    if (action === "set") {
        cache[key] = value;
        await writeFile(CACHE_FILE, JSON.stringify(cache, null, 2), "utf8");
        return { message: `Cached key '${key}'.` };
    }

    throw new Error(`Unknown action: ${action}`);
}