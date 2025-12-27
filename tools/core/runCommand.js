import { runCommandLogic } from "./runCommand.logic.js";
import { runCommandIO } from "./runCommand.io.js";

/**
 * Executes a shell command and returns the output.
 * Public tool entry point.
 */
export default async function runCommand(params = {}) {
    return runCommandLogic(params, runCommandIO);
}
