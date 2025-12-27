import { analyzeGcodeLogic } from "./analyzeGcode.logic.js";
import { analyzeGcodeIO } from "./analyzeGcode.io.js";

/**
 * Reads a .gcode or .nc file and extracts key machining parameters.
 * Public tool entry point.
 */
export default async function analyzeGcode(params = {}) {
    return analyzeGcodeLogic(params, analyzeGcodeIO);
}
