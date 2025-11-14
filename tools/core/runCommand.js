/**
 * Executes a shell command and returns the output.
 * @param {Object} params - Parameters for the tool.
 * @param {string} params.cmd - The command to execute.
 * @returns {Promise<Object>} Result object.
 * @example
 * { "cmd": "ls -la" }
 */

import { exec } from "child_process";

export default async function runCommand(params = {}) {
    return new Promise((resolve, reject) => {
        exec(params.cmd ?? "", (err, stdout, stderr) => {
            if (err) reject(new Error(stderr || err.message));
            else resolve({ output: stdout.trim() });
        });
    });
}