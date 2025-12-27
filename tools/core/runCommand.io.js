import { exec as cpExec } from "child_process";

/**
 * IO layer for runCommand tool.
 * Handles shell execution only.
 */
export const runCommandIO = {
    async exec(cmd) {
        return new Promise((resolve, reject) => {
            cpExec(cmd, (err, stdout, stderr) => {
                if (err) reject(new Error(stderr || err.message));
                else resolve(stdout);
            });
        });
    }
};
