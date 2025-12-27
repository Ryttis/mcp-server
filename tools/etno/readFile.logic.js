import { ToolError } from "../../errors/ToolError.js";

/**
 * Pure logic for etno.readFile tool.
 * Validates input and shapes output.
 */
export async function readEtnoFileLogic(params = {}, io) {
    const root = io.getRoot();
    if (!root) {
        throw new ToolError(
            "MISSING_ENV",
            "ETNOLENTOS_PATH not set"
        );
    }

    const { file } = params;
    if (!file) {
        throw new ToolError(
            "INVALID_PARAMS",
            "Missing 'file' param",
            { expected: ["file"], received: Object.keys(params || {}) }
        );
    }

    const absPath = io.resolvePath(root, file);
    const content = await io.read(absPath);

    return {
        path: absPath,
        size: content.length,
        preview: content.substring(0, 200),
    };
}
