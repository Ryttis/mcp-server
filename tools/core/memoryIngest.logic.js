import { ToolError } from "../../errors/ToolError.js";

export async function memoryIngestLogic(params = {}, io) {
    const { text, id = undefined, metadata = undefined } = params;

    if (typeof text !== "string" || text.trim().length === 0) {
        throw new ToolError("INVALID_INPUT", "Missing or invalid 'text' parameter");
    }

    if (id !== null && id !== undefined && typeof id !== "string") {
        throw new ToolError("INVALID_INPUT", "Invalid 'id' parameter");
    }

    if (
        metadata !== undefined &&
        (metadata === null || typeof metadata !== "object" || Array.isArray(metadata))
    ) {
        throw new ToolError("INVALID_INPUT", "Invalid 'metadata' parameter");
    }

    const result = await io.ingestText(text, { id, metadata });

    if (!result?.ok || typeof result.id !== "string") {
        throw new ToolError("MEMORY_ERROR", "mcp-memory returned an invalid ingest result");
    }

    return {
        ok: true,
        id: result.id
    };
}
