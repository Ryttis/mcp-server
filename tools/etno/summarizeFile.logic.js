import { ToolError } from "../../errors/ToolError.js";

/**
 * Pure logic for etno.summarizeFile tool.
 * Validates input, builds prompt, and shapes output.
 */
export async function summarizeFileLogic(params = {}, io) {
    const { file } = params;
    const root = io.getRoot();

    if (!root) {
        throw new ToolError(
            "MISSING_ENV",
            "ETNOLENTOS_PATH not set"
        );
    }

    if (!file) {
        throw new ToolError(
            "INVALID_PARAMS",
            "Missing 'file' parameter",
            { expected: ["file"], received: Object.keys(params || {}) }
        );
    }

    const fullPath = io.resolvePath(root, file);
    const content = await io.read(fullPath);

    const snippet =
        content.length > 8000
            ? content.slice(0, 8000) + "\n[...truncated]"
            : content;

    const prompt = `
You are an expert in woodcraft, CNC, and design documentation.
Summarize the following Etno-Lentos file in 5–10 bullet points.
Focus on purpose, materials, CNC relevance, or conceptual ideas.

--- FILE START ---
${snippet}
--- FILE END ---
`;

    const summary = await io.summarize(prompt);

    return {
        file: file,
        path: fullPath,
        length: content.length,
        summary: summary.trim(),
    };
}
