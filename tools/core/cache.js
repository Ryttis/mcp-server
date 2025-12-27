import { cacheLogic } from "./cache.logic.js";
import { cacheIO } from "./cache.io.js";

/**
 * Caches key-value pairs in a JSON file.
 * Public tool entry point.
 */
export default async function cacheTool(params = {}) {
    return cacheLogic(params, cacheIO);
}
