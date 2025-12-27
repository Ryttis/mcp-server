import { ToolError } from "../../errors/ToolError.js";

/**
 * Pure logic for writeFile tool.
 * Validates input and shapes output.
 */
export function writeFileLogic(params = {}, io) {
    const { path, content } = params;

    if (!path || typeof content !== "string") {
        throw new ToolError(
            "INVALID_PARAMS",
            "Missing path or content",
            { expected: ["path", "content"], received: Object.keys(params || {}) }
        );
    }

    return io.write(path, content).then(() => ({
        message: `File ${path} written.`
    }));
}
