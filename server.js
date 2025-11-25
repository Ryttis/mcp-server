/**
 * Starts the MCP server, initializes tools, workspaces, and sets up WebSocket connections.
 * @async
 * @returns {Promise<void>} Returns a promise that resolves when the server is fully initialized.
 */
import { WebSocketServer } from "ws";
import dotenv from "dotenv";
import { loadTools } from "./src/server/loader.js";
import { snapshotServer } from "./src/server/snapshot.js";
import { handleRpc } from "./src/server/rpc.js";
import { initLogger } from "./src/server/logger.js";
import { initWorkspaces } from "./src/server/workspace.js";

dotenv.config();

const PORT = 4000;
const AUTH_TOKEN = process.env.AUTH_TOKEN;

global.mcpState = global.mcpState || { tools: {}, startTime: new Date().toISOString() };
console.log("🧠 Initialized global.mcpState");

(async () => {
    await loadTools("./tools", "core");
    console.log("🧩 Tools loading initialized...");
    console.log("🧩 Tools in memory:", Object.keys(global.mcpState.tools));

    global.WORKSPACES = initWorkspaces();
    const appendContextLog = initLogger();

    const wss = new WebSocketServer({ port: PORT });
    console.log(`🚀 MCP Server running on ws://localhost:${PORT}`);

    wss.on("connection", (ws, req) => handleRpc(ws, req, AUTH_TOKEN, appendContextLog));

    // Snapshot every 5 minutes
    setInterval(() => snapshotServer(global.mcpState), 5 * 60 * 1000);

    process.on("SIGINT", () => {
        console.log("\n🛑 Shutting down MCP Server...");
        snapshotServer(global.mcpState);
        process.exit(0);
    });
})();
