import fs from "fs/promises";

/**
 * Saves a structured snapshot of MCP runtime state to /headers/latest.md
 * Used for monitoring, debugging, and persistence between restarts.
 */
export async function snapshotServer(state) {
    const timestamp = new Date().toISOString();
    const snapshot = {
        ...state,
        lastSnapshot: timestamp,
    };

    const content = `# MCP Snapshot — ${timestamp}\n\n\`\`\`json\n\n${JSON.stringify(snapshot, null, 2)}\n\n\`\`\`\n`;

    try {
        await fs.writeFile("./headers/latest.md", content, "utf8");
        console.log(`📝 Snapshot saved → headers/latest.md (${Object.keys(state.tools).length} tools)`);
    } catch (err) {
        console.error("⚠️ Failed to save snapshot:", err.message);
    }
}
