import { ToolError } from "../../errors/ToolError.js";
import { LIMITS } from "../../config/limits.js";
import {
    validateToolInput,
    validateToolOutput,
    validateContextBlock
} from "./protocolValidator.js";

function tryParseMessages(input) {
    if (!input || !input.trim()) return { messages: [], remainder: input };

    const messages = [];
    let depth = 0;
    let start = 0;
    let inString = false;
    let escape = false;
    let lastValidEnd = 0;

    for (let i = 0; i < input.length; i++) {
        const char = input[i];

        if (inString) {
            if (escape) {
                escape = false;
            } else if (char === "\\") {
                escape = true;
            } else if (char === "\"") {
                inString = false;
            }
            continue;
        }

        if (char === "\"") {
            inString = true;
            continue;
        }

        if (char === "{") {
            if (depth === 0) start = i;
            depth++;
        } else if (char === "}") {
            depth--;
            if (depth === 0) {
                const chunk = input.slice(start, i + 1);
                try {
                    messages.push(JSON.parse(chunk));
                    lastValidEnd = i + 1;
                } catch {
                    lastValidEnd = i + 1;
                }
            }
        }
    }

    return {
        messages,
        remainder: input.slice(lastValidEnd)
    };
}

export async function handleRpc(ws, req, AUTH_TOKEN, appendContextLog) {
    ws.internalBuffer = "";

    ws.on("message", async (rawMessage) => {
        try {
            ws.internalBuffer += rawMessage.toString();

            if (ws.internalBuffer.length > 1024 * 1024) {
                ws.terminate();
                return;
            }

            const { messages, remainder } = tryParseMessages(ws.internalBuffer);
            ws.internalBuffer = remainder;

            for (const data of messages) {
                await processRpcMessage(ws, req, AUTH_TOKEN, appendContextLog, data);
            }
        } catch {
            ws.internalBuffer = "";
        }
    });
}

function normalizeParams(params) {
    let p = params;

    if (Array.isArray(p)) {
        p = p.length === 1 ? p[0] : p;
    }

    while (typeof p === "string") {
        try {
            p = JSON.parse(p);
        } catch {
            throw new ToolError("INVALID_PARAMS", "Params must be valid JSON");
        }
    }

    if (typeof p !== "object" || p === null || Array.isArray(p)) {
        throw new ToolError("INVALID_PARAMS", "Params must be JSON object");
    }

    return p;
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
                error: { code: "UNAUTHORIZED", message: "Unauthorized" }
            }));
            return;
        }

        const tool = global.mcpState.tools[method];
        if (!tool) {
            ws.send(JSON.stringify({
                jsonrpc: "2.0",
                id,
                error: { code: "UNKNOWN_METHOD", message: `Unknown method: ${method}` }
            }));
            return;
        }

        const parsedParams = normalizeParams(params);

        validateToolInput(method, parsedParams);

        const result = await Promise.race([
            tool(parsedParams),
            new Promise((_, reject) =>
                setTimeout(() => {
                    reject(new ToolError("TIMEOUT", "Tool timeout"));
                }, LIMITS.TOOL_TIMEOUT_MS)
            )
        ]);

        validateToolOutput(method, result);

        if (Array.isArray(result)) {
            for (const item of result) {
                if (item?.type?.startsWith("mcp.context.")) {
                    validateContextBlock(item);
                }
            }
        }

        if (appendContextLog) appendContextLog(`[${new Date().toISOString()}] ${method}`);

        ws.send(JSON.stringify({
            jsonrpc: "2.0",
            id,
            result
        }));

    } catch (err) {
        if (err.code === "PROTOCOL_VIOLATION" || err.code === "INVALID_PARAMS") {
            ws.send(JSON.stringify({
                jsonrpc: "2.0",
                id,
                error: {
                    code: err.code,
                    message: err.message,
                    data: err.details || null
                }
            }));
            return;
        }

        ws.send(JSON.stringify({
            jsonrpc: "2.0",
            id,
            error: { code: "INTERNAL_ERROR", message: "Internal server error" }
        }));
    }
}
