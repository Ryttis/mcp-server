import { memoryQueryLogic } from "./memoryQuery.logic.js";
import { memoryQueryIO } from "./memoryQuery.io.js";

/**
 * Queries mcp-memory.
 * Public kernel tool entry point.
 */
export default async function memoryQuery(params = {}) {
    return memoryQueryLogic(params, memoryQueryIO);
}
