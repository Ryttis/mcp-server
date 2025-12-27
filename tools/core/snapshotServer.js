import { snapshotServerLogic } from "./snapshotServer.logic.js";
import { snapshotServerIO } from "./snapshotServer.io.js";

/**
 * Saves current MCP state snapshot into /headers/latest.md
 * and returns metadata for logging or API response.
 * Public tool entry point.
 */
export default async function snapshotServer(state) {
    return snapshotServerLogic(state, snapshotServerIO);
}
