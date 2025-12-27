import { getLastScanLogic } from "./getLastScan.logic.js";
import { getLastScanIO } from "./getLastScan.io.js";

/**
 * Returns last scan data from MCP state.
 * Public tool entry point.
 */
export default async function core_getLastScan(params = {}) {
    return getLastScanLogic(params, getLastScanIO);
}
