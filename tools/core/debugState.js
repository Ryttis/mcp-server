import { debugStateLogic } from "./debugState.logic.js";
import { debugStateIO } from "./debugState.io.js";

/**
 * Returns internal debug state.
 * Public tool entry point.
 */
export default async function core_debugState(params = {}) {
    return debugStateLogic(params, debugStateIO);
}
