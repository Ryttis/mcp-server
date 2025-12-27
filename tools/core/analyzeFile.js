import { analyzeFileLogic } from "./analyzeFile.logic.js";
import { analyzeFileIO } from "./analyzeFile.io.js";

/**
 * [MIGRATION] Analyze a file using AI.
 * Public kernel tool entry point.
 */
export default async function analyzeFile(params = {}) {
    return analyzeFileLogic(params, analyzeFileIO);
}
