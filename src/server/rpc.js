/**
 * 🧩 MCP RPC Handler — routes JSON-RPC messages to loaded tools
 * Kernel-safe, WebSocket-native, no buffering, no prompt logic
 */

import { ToolError } from "../../errors/ToolError.js";
import { LIMITS } from "../../config/limits.js";

/**
 * Tries to parse as many complete JSON objects as possible from the input buffer.
 * Returns { messages: any[], remainder: string }
 */
function tryParseMessages(input) {
    if (!input || !input.trim()) return { messages: [], remainder: input };

    const messages = [];
    let depth = 0;
    let start = 0;
    let inString = false;
    let paramsEscape = false;
    let lastValidEnd = 0;

    // Scan through input to find complete JSON objects
    for (let i = 0; i < input.length; i++) {
        const char = input[i];

        if (inString) {
            if (paramsEscape) {
                paramsEscape = false;
            } else if (char === '\\') {
                paramsEscape = true;
            } else if (char === '"') {
                inString = false;
            }
            continue;
        }

        if (char === '"') {
            inString = true;
            continue;
        }

        if (char === '{') {
            if (depth === 0) start = i;
            depth++;
        } else if (char === '}') {
            depth--;
            if (depth === 0) {
                // Potential object end found
                const chunk = input.slice(start, i + 1);
                try {
                    const parsed = JSON.parse(chunk);
                    messages.push(parsed);
                    lastValidEnd = i + 1;
                } catch (err) {
                    // Start definitely looked like an object but failed parse.
                    // This implies malformed JSON in the stream.
                    // We consume it to avoid stuck buffer, but log error.
                    console.error("RPC Stream Malformed Chunk:", chunk);
                    lastValidEnd = i + 1; // Discard this chunk
                }
            }
        }
    }

    // If we have characters before the first {, discard them (whitespace/noise)
    // Actually, we should just return what's left after the last valid object.

    // However, if we didn't find ANY objects, but have content, we need to decide:
    // Is it incomplete (depth > 0) or garbage?
    // For specific start index logic, simple approach:
    // Everything up to lastValidEnd is consumed.

    return {
        messages,
        remainder: input.slice(lastValidEnd)
    };
}

export async function handleRpc(ws, req, AUTH_TOKEN, appendContextLog) {
    // Initialize connection buffer
    ws.internalBuffer = "";

    ws.on("message", async (rawMessage) => {
        try {
            const chunk = rawMessage.toString();
            ws.internalBuffer += chunk;

            // Enforce max buffer size to prevent memory leaks from noise/attacks
            if (ws.internalBuffer.length > 1024 * 1024) { // 1MB limit
                console.error("RPC Buffer overflow, disconnecting client");
                ws.terminate();
                return;
            }

            const { messages, remainder } = tryParseMessages(ws.internalBuffer);
            ws.internalBuffer = remainder;

            // Process fully parsed messages
            for (const data of messages) {
                await processRpcMessage(ws, req, AUTH_TOKEN, appendContextLog, data);
            }

        } catch (err) {
            console.error("RPC Fatal Error:", err);
            // In fatal logic error, we might clear buffer to recover
            ws.internalBuffer = "";
        }
    });
}

async function processRpcMessage(ws, req, AUTH_TOKEN, appendContextLog, data) {
    let id = data.id ?? null;

    try {
        const { method, params = {} } = data;

        if (!method) {
            throw new ToolError("INVALID_RPC", "Missing RPC method");
        }

        const url = new URL(req.url, `ws://${req.headers.host}`);
        const token = url.searchParams.get("token");

        if (AUTH_TOKEN && token !== AUTH_TOKEN) {
            ws.send(JSON.stringify({
                jsonrpc: "2.0",
                id,
                error: {
                    code: "UNAUTHORIZED",
                    message: "Unauthorized"
                }
            }));
            return;
        }

        const tool = global.mcpState.tools[method];
        if (!tool) {
            ws.send(JSON.stringify({
                jsonrpc: "2.0",
                id,
                error: {
                    code: "UNKNOWN_METHOD",
                    message: `Unknown method: ${method}`
                }
            }));
            return;
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
}
