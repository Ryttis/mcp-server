import { ToolError } from "../../errors/ToolError.js";

/**
 * Pure logic for setLastContext tool.
 * Validates input and shapes output.
 */
export async function setLastContextLogic(params = {}, io) {
    const { context } = params || {};

    if (!context) {
        throw new ToolError(
            "INVALID_PARAMS",
            "Missing 'context' in params. Use { context }.",
            { expected: ["context"], received: Object.keys(params || {}) }
        );
    }

    io.setLastContext(context);

    return {
        ok: true,
        saved: true,
        timestamp: io.nowISO(),
    };
}
