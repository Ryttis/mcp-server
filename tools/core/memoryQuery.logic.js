import { ToolError } from "../../errors/ToolError.js";

export async function memoryQueryLogic(params = {}, io) {
    const { query, topK } = params;

    if (typeof query !== "string" || query.trim().length === 0) {
        throw new ToolError("INVALID_INPUT", "Missing or invalid 'query' parameter");
    }

    if (
        topK !== undefined &&
        (!Number.isInteger(topK) || topK <= 0)
    ) {
        throw new ToolError("INVALID_INPUT", "Invalid 'topK' parameter");
    }

    const result = await io.queryMemory(query, topK);

    if (!result || !Array.isArray(result.results)) {
        throw new ToolError("MEMORY_ERROR", "mcp-memory returned an invalid query result");
    }

    return result;
}
