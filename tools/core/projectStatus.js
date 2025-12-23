import fs from "fs";
import { execSync } from "child_process";
import path from "path";

export default function projectStatus() {
    const safeRead = (p) => {
        try {
            return fs.readFileSync(p, "utf8");
        } catch {
            return "(missing)";
        }
    };

    const tree = execSync("tree -I 'node_modules|.git'").toString();

    return {
        timestamp: new Date().toISOString(),
        cwd: process.cwd(),

        mcpState: {
            toolCount: Object.keys(global.mcpState.tools || {}).length,
            startTime: global.mcpState.startTime,
            lastSnapshot: global.mcpState.lastSnapshot || null,
            tools: Object.keys(global.mcpState.tools || {}),
        },

        workspaces: global.WORKSPACES || {},

        // Directory snapshot
        tree,

        // Critical files
        files: {
            "server.js": safeRead("./server.js"),
            "loader.js": safeRead("./src/server/loader.js"),
            "rpc.js": safeRead("./src/server/rpc.js"),
            "logger.js": safeRead("./src/server/logger.js"),
            "workspace.js": safeRead("./src/server/workspace.js"),
            "snapshot.js": safeRead("./src/server/snapshot.js"),
        }
    };
}
