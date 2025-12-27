import { logParseLogic } from "./logParse.logic.js";
import { logParseIO } from "./logParse.io.js";

/**
 * Reads and parses a log file.
 * Public tool entry point.
 */
export default async function logParse(params = {}) {
    return logParseLogic(params, logParseIO);
}
