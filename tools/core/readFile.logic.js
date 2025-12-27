import { ToolError } from "../../errors/ToolError.js";

/**
 * Pure logic for readFile tool.
 * Validates input and shapes output.
 */
export function readFileLogic(params = {}, io) {
    if (!params.path) {
        throw new ToolError(
            "INVALID_PARAMS",
            "Missing 'path' parameter",
            { expected: ["path"], received: Object.keys(params || {}) }
        );
    }

    return io.read(params.path).then((content) => ({ content }));
}
