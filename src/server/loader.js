import { mcpState } from "./state.js";
import { TOOL_REGISTRY } from "../../tools/index.js";

/**
 * Loads all MCP tools from the central registry (`tools/index.js`)
 * and registers them into the global MCP state under `global.mcpState.tools`.
 *
 * @async
 * @function loadTools
 * @returns {Promise<void>} Resolves once all tools are registered.
 */
export async function loadTools() {
    mcpState.tools = mcpState.tools || {};

    console.log(`🔌 Loading tools from static registry...`);

    for (const tool of TOOL_REGISTRY) {
        // Register the tool using its explicit name from the registry (e.g. "core.ping")
        mcpState.tools[tool.name] = tool.handler;
        console.log(`✅ Loaded: ${tool.name}`);
    }

    console.log(`🎉 Total tools loaded: ${TOOL_REGISTRY.length}`);
}