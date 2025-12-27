import { summarizeFileLogic } from "./summarizeFile.logic.js";
import { summarizeFileIO } from "./summarizeFile.io.js";

/**
 * Summarizes an Etno-Lentos project file using GPT.
 * Public tool entry point.
 */
export default async function summarizeFile(params = {}) {
    return summarizeFileLogic(params, summarizeFileIO);
}
