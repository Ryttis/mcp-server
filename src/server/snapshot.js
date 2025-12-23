import fs from "fs/promises";
import path from "path";
import { mcpState } from "./state.js";

/**
 * serverSnapshot()
 *
 * Automatic periodic snapshot of the MCP Server state.
 * This version:
 *  - Reads mcpState (single source of truth)
 *  - Updates lastSnapshot timestamp
 *  - Writes headers/latest_phr-website.md
 *  - Does NOT conflict with the manual tool snapshot
 *
 * This is the ONLY official server-side snapshot generator.
 */
export async function serverSnapshot() {
    try {
        const timestamp = new Date().toISOString();

        mcpState.lastSnapshot = timestamp;

        const snapshot = {
            ...mcpState
        };

        const baseDir = path.resolve("./");
        const headersDir = path.join(baseDir, "headers");
        const headersPath = path.join(headersDir, "latest_phr-website.md");

        await fs.mkdir(headersDir, { recursive: true });

        const content = [
            `# MCP Snapshot — ${timestamp}`,
            "```json",
            JSON.stringify(snapshot, null, 2),
            "```"
        ].join("\n\n");

        await fs.writeFile(headersPath, content, "utf8");

        console.log(`📸 Server snapshot saved: ${headersPath}`);
        return true;

    } catch (err) {
        console.error("❌ serverSnapshot error:", err);
        return false;
    }
}
