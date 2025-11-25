/**
 * Primitive Step: backupFiles
 * Creates backup copies of selected files.
 */

import { backupAllSelectedFiles } from "../../backup/manager.js";
import { logStep } from "../../logging/logger.js";

export async function run(context) {
    logStep(context, "backupFiles", "Backing up selected files…");
    return await backupAllSelectedFiles(context);
}
