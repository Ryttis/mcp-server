import { readProjectFileLogic } from "./readProjectFile.logic.js";
import { readProjectFileIO } from "./readProjectFile.io.js";

/**
 * Reads a file from the FacturaCore project directory.
 * Public tool entry point.
 */
export default async function readProjectFile(params = {}) {
    return readProjectFileLogic(params, readProjectFileIO);
}
