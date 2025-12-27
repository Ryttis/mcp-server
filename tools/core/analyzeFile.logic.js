import { ToolError } from "../../errors/ToolError.js";

/**
 * Pure logic for core.analyzeFile.
 * Validates input and shapes output.
 */
export async function analyzeFileLogic(params = {}, io) {
    const { path } = params;

    if (!path || typeof path !== "string") {
        throw new ToolError("INVALID_INPUT", "Missing or invalid 'path' parameter");
    }

    const content = await io.read(path);
    const analysis = await io.analyze(content);

    return {
        path,
        length: content.length,
        analysis
    };
}
