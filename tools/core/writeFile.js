import { writeFileLogic } from "./writeFile.logic.js";
import { writeFileIO } from "./writeFile.io.js";

/**
 * Writes content to a file at the specified path.
 * Public tool entry point.
 */
export default async function writeFileTool(params = {}) {
    return writeFileLogic(params, writeFileIO);
}
