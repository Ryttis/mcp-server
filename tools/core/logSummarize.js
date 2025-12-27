import { logSummarizeLogic } from "./logSummarize.logic.js";
import { logSummarizeIO } from "./logSummarize.io.js";

/**
 * Summarizes log files by parsing entries and generating a summary using GPT.
 * Public tool entry point.
 */
export default async function logSummarize(params = {}) {
    return logSummarizeLogic(params, logSummarizeIO);
}
