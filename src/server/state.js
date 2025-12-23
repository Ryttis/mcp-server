/**
 * Single source of truth for MCP Server state.
 * Stored ONLY in global.mcpState.
 */

if (!global.mcpState) {
    global.mcpState = {
        tools: {},
        startTime: new Date().toISOString(),
        lastSnapshot: null,
        lastContext: null,
    };
}
export const mcpState = global.mcpState;
