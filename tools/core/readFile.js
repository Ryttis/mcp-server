import { readFileLogic } from "./readFile.logic.js";
import { readFileIO } from "./readFile.io.js";

/**
 * Reads a file and returns its content.
 * Public tool entry point.
 */
export default async function readFileTool(params = {}) {
    return readFileLogic(params, readFileIO);
}
