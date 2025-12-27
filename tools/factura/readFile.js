import { readFacturaFileLogic } from "./readFile.logic.js";
import { readFacturaFileIO } from "./readFile.io.js";

/**
 * Reads a file from FACTURACORE_PATH and returns metadata.
 * Public tool entry point.
 */
export default async function readFacturaFile(params = {}) {
    return readFacturaFileLogic(params, readFacturaFileIO);
}
