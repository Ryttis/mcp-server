import { ToolError } from "../../errors/ToolError.js";

/**
 * Pure logic for cache tool.
 * Validates input and applies cache actions.
 */
export async function cacheLogic(params = {}, io) {
    const { action, key, value } = params;

    if (!action || !key) {
        throw new ToolError(
            "INVALID_PARAMS",
            "Missing action or key",
            { expected: ["action", "key"], received: Object.keys(params || {}) }
        );
    }

    const cache = await io.read();

    if (action === "get") {
        return { value: cache[key] ?? null };
    }

    if (action === "set") {
        const updated = { ...cache, [key]: value };
        await io.write(updated);
        return { message: `Cached key '${key}'.` };
    }

    throw new ToolError(
        "UNKNOWN_ACTION",
        `Unknown action: ${action}`,
        { action }
    );
}
