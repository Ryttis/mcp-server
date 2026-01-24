import { memoryQueryLogic } from "./memoryQuery.logic.js";
import { memoryQueryIO } from "./memoryQuery.io.js";

/**
 * Public MCP tool entry point: core.memoryQuery
 */
export default async function memoryQuery(params = {}) {
    return memoryQueryLogic(params, memoryQueryIO);
}
