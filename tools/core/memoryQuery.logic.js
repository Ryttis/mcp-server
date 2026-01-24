import { memoryQuery } from "../../src/server/memoryAdapter.js";

/**
 * Tool logic for querying MCP memory.
 */
export async function memoryQueryLogic(params, io) {
    const { query, topK } = io.validate(params);
    return memoryQuery({ query, topK });
}
