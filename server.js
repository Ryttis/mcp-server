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

const DEFAULT_PORT = 4000;
const AUTH_TOKEN = process.env.AUTH_TOKEN;

let snapshotInterval = null;

/**
 * Start MCP server (programmatic + CLI)
 */
export async function startServer({ port = DEFAULT_PORT } = {}) {
    console.log("🧠 MCP Server state initialized:", {
        startTime: mcpState.startTime
    });

    await loadTools();
    console.log("🧩 Tools loaded:", Object.keys(mcpState.tools));

    global.WORKSPACES = initWorkspaces();
    const appendContextLog = initLogger();

    const wss = new WebSocketServer({ port });
    console.log(`🚀 MCP Server running on ws://localhost:${port}`);

    wss.on("connection", (ws, req) =>
        handleRpc(ws, req, AUTH_TOKEN, appendContextLog)
    );

    snapshotInterval = setInterval(serverSnapshot, 5 * 60 * 1000);

    async function close() {
        console.log("🛑 Shutting down MCP Server...");

        if (snapshotInterval) {
            clearInterval(snapshotInterval);
            snapshotInterval = null;
        }

        // Close all WS connections immediately
        wss.clients.forEach(client => client.terminate());
        wss.close();

        await serverSnapshot();
    }

    return { close };
}

/**
 * CLI entrypoint (unchanged behavior)
 */
if (import.meta.url === `file://${process.argv[1]}`) {
    startServer({ port: DEFAULT_PORT });

    process.on("SIGINT", async () => {
        console.log("\n🛑 SIGINT received");
        process.exit(0);
    });
}
