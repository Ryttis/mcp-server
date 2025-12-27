import { readEtnoFileLogic } from "./readFile.logic.js";
import { readEtnoFileIO } from "./readFile.io.js";

/**
 * Reads a file from ETNOLENTOS_PATH and returns a preview.
 * Public tool entry point.
 */
export default async function readEtnoFile(params = {}) {
    return readEtnoFileLogic(params, readEtnoFileIO);
}
