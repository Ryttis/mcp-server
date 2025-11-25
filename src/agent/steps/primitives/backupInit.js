/**
 * Primitive Step: backupInit
 * Creates a backup root directory for this run.
 */

import { initializeBackupRoot } from "../../backup/manager.js";
import { logStep } from "../../logging/logger.js";

export async function run(context) {
    logStep(context, "backupInit", "Initializing backup root…");
    return await initializeBackupRoot(context);
}
