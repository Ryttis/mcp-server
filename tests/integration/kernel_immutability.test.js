import assert from "node:assert/strict";
import WebSocket from "ws";
import { test, describe, before, after } from "node:test";
import { startServer } from "../../server.js";

let ws;
let serverHandle;

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
    // port: 0 lets the OS pick a free ephemeral port — no hang if 4000 is occupied
    serverHandle = await startServer({ port: 0 });

    const wsUrl = `ws://127.0.0.1:${serverHandle.port}`;
    const token = process.env.AUTH_TOKEN;
    const url = token ? `${wsUrl}?token=${token}` : wsUrl;
    ws = new WebSocket(url);
    await new Promise(resolve => ws.once("open", resolve));
});

after(async () => {
    if (ws) {
        ws.terminate();
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
