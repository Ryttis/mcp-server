import { ToolError } from "../../errors/ToolError.js";

export async function llmCompleteLogic(params = {}, io) {
    const {
        prompt,
        systemPrompt,
        model = "gpt-4o-mini",
        response_format
    } = params;

    if (typeof prompt !== "string" || prompt.trim().length === 0) {
        throw new ToolError("INVALID_INPUT", "Missing or invalid 'prompt' parameter");
    }

    if (systemPrompt !== undefined && typeof systemPrompt !== "string") {
        throw new ToolError("INVALID_INPUT", "Invalid 'systemPrompt' parameter");
    }

    if (typeof model !== "string" || model.trim().length === 0) {
        throw new ToolError("INVALID_INPUT", "Invalid 'model' parameter");
    }

    return io.complete({
        prompt,
        systemPrompt,
        model,
        response_format
    });
}
