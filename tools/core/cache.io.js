import { readFile, writeFile } from "fs/promises";

const CACHE_FILE = "./cache.json";

/**
 * IO layer for cache tool.
 * Handles filesystem persistence.
 */
export const cacheIO = {
    async read() {
        try {
            const content = await readFile(CACHE_FILE, "utf8");
            return JSON.parse(content || "{}");
        } catch {
            return {};
        }
    },

    async write(cache) {
        await writeFile(
            CACHE_FILE,
            JSON.stringify(cache, null, 2),
            "utf8"
        );
    }
};
