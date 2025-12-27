import { mcpState } from "../../src/server/state.js";

/**
 * IO layer for debugState tool.
 * Reads MCP server state.
 */
export const debugStateIO = {
    getState() {
        return mcpState;
    }
};
