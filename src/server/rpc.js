/**
 * 🧩 MCP RPC Handler — routes JSON-RPC messages to loaded tools
 * Supports calls from local bridge and project namespaces.
 */

import { ToolError } from "../../errors/ToolError.js";
import { LIMITS } from "../../config/limits.js";

export async function handleRpc(ws, req, AUTH_TOKEN, appendContextLog) {
    ws.on("message", async (message) => {
        let id = null;

        try {
            const data = JSON.parse(message);
            id = data.id ?? null;

            const { method, params = {} } = data;

            if (!method) {
                throw new ToolError("INVALID_RPC", "Missing RPC method");
            }

            const url = new URL(req.url, `ws://${req.headers.host}`);
            const token = url.searchParams.get("token");

            if (AUTH_TOKEN && token !== AUTH_TOKEN) {
                return ws.send(JSON.stringify({
                    jsonrpc: "2.0",
                    id,
                    error: {
                        code: "UNAUTHORIZED",
                        message: "Unauthorized"
                    }
                }));
            }

            const tool = global.mcpState.tools[method];
            if (!tool) {
                return ws.send(JSON.stringify({
                    jsonrpc: "2.0",
                    id,
                    error: {
                        code: "UNKNOWN_METHOD",
                        message: `Unknown method: ${method}`
                    }
                }));
            }

            const result = await Promise.race([
                tool(params),
                new Promise((_, reject) =>
                    setTimeout(() => {
                        reject(
                            new ToolError(
                                "TIMEOUT",
                                `Tool execution exceeded ${LIMITS.TOOL_TIMEOUT_MS} ms`,
                                { timeout: LIMITS.TOOL_TIMEOUT_MS }
                            )
                        );
                    }, LIMITS.TOOL_TIMEOUT_MS)
                )
            ]);


            if (appendContextLog)
                appendContextLog(`[${new Date().toISOString()}] ${method}`);

            ws.send(JSON.stringify({
                jsonrpc: "2.0",
                id,
                result
            }));

        } catch (err) {
            console.error("RPC error:", err);

            if (err instanceof ToolError) {
                ws.send(JSON.stringify({
                    jsonrpc: "2.0",
                    id,
                    error: {
                        code: err.code,
                        message: err.message,
                        data: err.data
                    }
                }));
            } else {
                ws.send(JSON.stringify({
                    jsonrpc: "2.0",
                    id,
                    error: {
                        code: "INTERNAL_ERROR",
                        message: "Internal server error"
                    }
                }));
            }
        }
    });
}
