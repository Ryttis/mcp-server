import fs from "fs";
import path from "path";

/**
 * Initializes the MCP context logger.
 * Logs all tool calls with timestamps into .ai/context.md
 */
export function initLogger() {
    const logDir = ".ai";
    const logFile = path.join(logDir, "context.md");
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

    return function appendContextLog(toolName, extra = "") {
        const stamp = new Date().toISOString();
        const line = `[${stamp}] ${toolName}${extra ? " " + extra : ""}\n`;
        fs.appendFileSync(logFile, line);
    };
}
