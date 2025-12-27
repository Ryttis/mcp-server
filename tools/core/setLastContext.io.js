import { mcpState } from "../../src/server/state.js";

/**
 * IO layer for setLastContext tool.
 * Mutates MCP server state and provides time source.
 */
export const setLastContextIO = {
    setLastContext(context) {
        mcpState.lastContext = context;
    },

    nowISO() {
        return new Date().toISOString();
    }
};
