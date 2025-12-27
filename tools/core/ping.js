import { pingLogic } from "./ping.logic.js";
import { pingIO } from "./ping.io.js";

/**
 * Checks connection to the MCP server.
 * Public tool entry point.
 */
export default async function ping(params = {}) {
    return pingLogic(params, pingIO);
}
