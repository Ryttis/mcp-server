import { memoryIngestLogic } from "./memoryIngest.logic.js";
import { memoryIngestIO } from "./memoryIngest.io.js";

/**
 * Ingests text into mcp-memory.
 * Public kernel tool entry point.
 */
export default async function memoryIngest(params = {}) {
    return memoryIngestLogic(params, memoryIngestIO);
}
