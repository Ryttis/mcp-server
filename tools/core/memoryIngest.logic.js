import { memoryIngest } from "../../src/server/memoryAdapter.js";

/**
 * Tool logic for ingesting text into MCP memory.
 */
export async function memoryIngestLogic(params, io) {
    const { text, id, metadata } = io.validate(params);
    return memoryIngest({ text, id, metadata });
}
