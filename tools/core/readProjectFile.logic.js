import { ToolError } from "../../errors/ToolError.js";

/**
 * Pure logic for readProjectFile tool.
 * Validates input and shapes output.
 */
export async function readProjectFileLogic(params = {}, io) {
    const root = io.getRoot();
    if (!root) {
        throw new ToolError(
            "MISSING_ENV",
            "Missing FACTURACORE_PATH"
        );
    }

    if (!params.file) {
        throw new ToolError(
            "INVALID_PARAMS",
            "Missing 'file' parameter",
            { expected: ["file"], received: Object.keys(params || {}) }
        );
    }

    const filePath = io.resolvePath(root, params.file);
    const content = await io.read(filePath);

    return {
        path: filePath,
        size: content.length,
        content
    };
}
