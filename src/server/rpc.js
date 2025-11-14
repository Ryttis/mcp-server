/**
 * 🧩 MCP RPC Handler — routes JSON-RPC messages to loaded tools
 * Supports calls from local bridge and project namespaces.
 */

export async function handleRpc(ws, req, AUTH_TOKEN, appendContextLog) {
    ws.on("message", async (message) => {
        try {
            const data = JSON.parse(message);
            const { id, method, params = {} } = data;

            if (!method) throw new Error("Missing RPC method");

            // 🔐 Optional auth check via query token
            const url = new URL(req.url, `ws://${req.headers.host}`);
            const token = url.searchParams.get("token");
            if (AUTH_TOKEN && token !== AUTH_TOKEN) {
                return ws.send(JSON.stringify({ id, error: { message: "Unauthorized" } }));
            }

            // 🧠 Resolve tool by name
            const tool = global.mcpState.tools[method];
            if (!tool) {
                ws.send(JSON.stringify({ id, error: { message: `Unknown method: ${method}` } }));
                return;
            }

            // 🧩 Execute tool
            const result = await tool(params);
            if (appendContextLog)
                appendContextLog(`[${new Date().toISOString()}] ${method}`);

            ws.send(JSON.stringify({ jsonrpc: "2.0", id, result }));
        } catch (err) {
            console.error("RPC error:", err);
            ws.send(
                JSON.stringify({
                    jsonrpc: "2.0",
                    error: { message: err.message, stack: err.stack },
                })
            );
        }
    });
}
