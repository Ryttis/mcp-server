/**
 * MCP Server — main entry point.
 * Initializes tools, workspaces, logging, RPC handler and periodic snapshotting.
 */

import { WebSocketServer } from "ws";
import dotenv from "dotenv";

import { loadTools } from "./src/server/loader.js";
import { handleRpc } from "./src/server/rpc.js";
import { initLogger } from "./src/server/logger.js";
import { initWorkspaces } from "./src/server/workspace.js";
import { serverSnapshot } from "./src/server/snapshot.js";
import { mcpState } from "./src/server/state.js";

dotenv.config();

const PORT = 4000;
const AUTH_TOKEN = process.env.AUTH_TOKEN;

console.log("🧠 MCP Server state initialized:", {
    startTime: mcpState.startTime
});

(async () => {
    await loadTools();
    console.log("🧩 Tools loaded:", Object.keys(mcpState.tools));

    global.WORKSPACES = initWorkspaces();
    const appendContextLog = initLogger();

    const wss = new WebSocketServer({ port: PORT });
    console.log(`🚀 MCP Server running on ws://localhost:${PORT}`);

    wss.on("connection", (ws, req) =>
        handleRpc(ws, req, AUTH_TOKEN, appendContextLog)
    );

    setInterval(serverSnapshot, 5 * 60 * 1000);

    process.on("SIGINT", async () => {
        console.log("\n🛑 Shutting down MCP Server...");
        await serverSnapshot();
        process.exit(0);
    });
})();
