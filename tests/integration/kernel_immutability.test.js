import assert from "node:assert/strict";
import WebSocket from "ws";
import { test, describe, before, after } from "node:test";
import { startServer } from "../../server.js";

const WS_URL = "ws://127.0.0.1:4000";

let ws;
let serverHandle;

/**
 * Send one MCP RPC call and wait for single response
 */
function rpc(method, params = {}) {
    return new Promise((resolve, reject) => {
        const id = Math.floor(Math.random() * 1e9);

        ws.send(JSON.stringify({
            jsonrpc: "2.0",
            id,
            method,
            params
        }));

        ws.once("message", (msg) => {
            resolve(JSON.parse(msg.toString()));
        });

        ws.once("error", reject);
    });
}

before(async () => {
    // Start server IN-PROCESS (required for node:test)
    serverHandle = await startServer({ port: 4000 });

    // Connect WebSocket client
    const token = process.env.AUTH_TOKEN;
    const url = token ? `${WS_URL}?token=${token}` : WS_URL;
    ws = new WebSocket(url);
    await new Promise(resolve => ws.once("open", resolve));
});

after(async () => {
    if (ws) {
        ws.terminate(); // hard close, no hang
    }

    if (serverHandle) {
        await serverHandle.close();
    }
});

describe("Kernel immutability", { timeout: 5000 }, () => {

    test("ping tool responds", async () => {
        const res = await rpc("core.ping");

        assert.equal(res.jsonrpc, "2.0");
        assert.ok(res.result);
    });

    test("unknown tool returns ToolError", async () => {
        const res = await rpc("unknownTool");

        assert.ok(res.error);
        assert.equal(res.error.code, "UNKNOWN_METHOD");
    });

});
