import { snapshotToolLogic } from "./snapshotTool.logic.js";
import { snapshotToolIO } from "./snapshotTool.io.js";

/**
 * Writes snapshot JSON for the last executed project.
 * Public tool entry point.
 */
export default async function core_snapshotTool(params = {}) {
    return snapshotToolLogic(params, snapshotToolIO);
}
