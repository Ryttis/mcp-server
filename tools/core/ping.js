/**
 * Checks connection to the MCP server.
 * @returns {Promise<Object>} Result object.
 * @example
 * { "id": 1, "method": "core_ping", "params": {} }
 */
export default async function ping() {
    return { message: "pong" };
}