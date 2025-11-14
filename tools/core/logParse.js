/**
 * Reads and parses a log file using @ryttis/logpilot.
 * @param {Object} params - Parameters for the tool.
 * @param {string} params.path - File path or similar input.
 * @returns {Promise<Object>} Result object.
 * @example
 * { "id": 1, "method": "core_logParse", "params": { "path": "example.txt" } }
 */
import { parseLogFile } from "@ryttis/logpilot";

/**
 * Tool: logParse
 * Reads and parses a log file using @ryttis/logpilot.
 *
 * Params:
 *  - path: string  (path to the log file)
 */
export default async function logParse(params = {}) {
  if (!params.path) {
    throw new Error("Missing 'path' parameter");
  }

  const entries = await parseLogFile(params.path);

  return {
    message: `Parsed ${entries.length} entries from ${params.path}`,
    count: entries.length,
    sample: entries.slice(0, 10),
  };
}