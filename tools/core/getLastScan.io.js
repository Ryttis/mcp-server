import { mcpState } from "../../src/server/state.js";

/**
 * IO layer for getLastScan tool.
 * Reads MCP server state.
 */
export const getLastScanIO = {
    getLastContext() {
        return mcpState.lastContext;
    }
};
