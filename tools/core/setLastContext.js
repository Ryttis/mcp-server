import { setLastContextLogic } from "./setLastContext.logic.js";
import { setLastContextIO } from "./setLastContext.io.js";

/**
 * Sets lastContext in MCP server state.
 * Public tool entry point.
 */
export default async function core_setLastContext(params = {}) {
    return setLastContextLogic(params, setLastContextIO);
}
