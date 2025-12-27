import { mcpState } from "./state.js";
import { TOOL_REGISTRY } from "../../tools/index.ts";

/**
 * Loads MCP tools from the central TOOL_REGISTRY and registers them
 * into the global MCP state under `mcpState.tools`.
 *
 * This replaces dynamic filesystem scanning and makes the tool surface
 * explicit and stable.
 *
 * Tool keys remain in the legacy format:
 *   core.ping  -> core_ping
 *   etno.readFile -> etno_readFile
 *
 * @async
 * @function loadTools
 * @returns {Promise<void>}
 */
export async function loadTools() {
    mcpState.tools = mcpState.tools || {};

    for (const def of TOOL_REGISTRY) {
        const key = def.name.replace(".", "_");

        try {
            if (typeof def.handler === "function") {
                mcpState.tools[key] = def.handler;
                console.log(`✅ Loaded: ${key} (v${def.version})`);
            } else {
                console.warn(`⚠️ Tool ${key} has no valid handler`);
            }
        } catch (err) {
            console.error(`❌ Failed to load tool: ${key}`, err);
        }
    }
}
