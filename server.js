/**
 * MCP Server — main entry point.
 * Initializes tools, workspaces, logging, RPC handler and periodic snapshotting.
 */

import { WebSocketServer } from "ws";
import http from "http";
import dotenv from "dotenv";

import { loadTools } from "./src/server/loader.js";
import { handleRpc } from "./src/server/rpc.js";
import { initLogger } from "./src/server/logger.js";
import { initWorkspaces } from "./src/server/workspace.js";
import { serverSnapshot } from "./src/server/snapshot.js";
import { mcpState } from "./src/server/state.js";
import { handleTwilioVoiceRoute } from "./src/voice/twilioRoutes.js";

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

    const httpServer = http.createServer(async (req, res) => {
        try {
            if (await handleTwilioVoiceRoute(req, res)) {
                return;
            }
            res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
            res.end("Not found");
        } catch (err) {
            console.error("HTTP route error:", { path: req.url, message: err.message });
            res.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
            res.end("Internal server error");
        }
    });
    const wss = new WebSocketServer({ server: httpServer });
    const listenPort = await new Promise((resolve, reject) => {
        httpServer.once("error", reject);
        httpServer.listen(port, () => {
            httpServer.off("error", reject);
            resolve(httpServer.address().port);
        });
    });
    console.log(`🚀 MCP Server running on ws://localhost:${listenPort}`);

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
        await new Promise((resolve, reject) => {
            wss.close((err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        await new Promise((resolve, reject) => {
            httpServer.close((err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        await serverSnapshot();
    }

    return { close, port: listenPort };
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
