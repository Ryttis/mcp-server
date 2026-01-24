import { memoryIngestLogic } from "./memoryIngest.logic.js";
import { memoryIngestIO } from "./memoryIngest.io.js";

/**
 * Public MCP tool entry point: core.memoryIngest
 */
export default async function memoryIngest(params = {}) {
    return memoryIngestLogic(params, memoryIngestIO);
}
