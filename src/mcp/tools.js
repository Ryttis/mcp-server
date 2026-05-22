import { z } from "zod";
import coreMemoryIngest from "../../tools/core/memoryIngest.js";
import coreMemoryQuery from "../../tools/core/memoryQuery.js";
import coreLlmComplete from "../../tools/core/llmComplete.js";
import { ToolError } from "../../errors/ToolError.js";
import { LIMITS } from "../../config/limits.js";

const SAFE_INTERNAL_TOOL_REGISTRY = {
    "core.memoryIngest": coreMemoryIngest,
    "core.memoryQuery": coreMemoryQuery,
    "core.llmComplete": coreLlmComplete
};

const DANGEROUS_INTERNAL_TOOLS = new Set([
    "core.runCommand",
    "core.writeFile",
    "core.dbQuery"
]);

function jsonContent(result) {
    return {
        content: [
            {
                type: "text",
                text: JSON.stringify(result, null, 2)
            }
        ]
    };
}

function normalizeError(err) {
    if (err instanceof ToolError) {
        return {
            code: err.code,
            message: err.message,
            data: err.data
        };
    }

    return {
        code: "MCP_STDIO_TOOL_ERROR",
        message: err?.message || String(err)
    };
}

export async function callRegisteredTool(toolName, params = {}, {
    registry = SAFE_INTERNAL_TOOL_REGISTRY,
    timeoutMs = LIMITS.TOOL_TIMEOUT_MS
} = {}) {
    if (DANGEROUS_INTERNAL_TOOLS.has(toolName)) {
        throw new ToolError("FORBIDDEN_TOOL", `Tool is not exposed through MCP stdio: ${toolName}`);
    }

    const entry = registry[toolName];
    const handler = entry?.handler || entry;

    if (typeof handler !== "function") {
        throw new ToolError("UNKNOWN_TOOL", `Unknown internal tool: ${toolName}`);
    }

    let timeoutId;
    const timeout = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
            reject(new ToolError("TIMEOUT", `Tool execution exceeded ${timeoutMs} ms`, { timeout: timeoutMs }));
        }, timeoutMs);
    });

    try {
        return await Promise.race([
            handler(params),
            timeout
        ]);
    } finally {
        clearTimeout(timeoutId);
    }
}

export const MCP_STDIO_TOOL_DEFINITIONS = [
    {
        name: "memory_ingest",
        internalName: "core.memoryIngest",
        description: "Store text in semantic memory.",
        inputSchema: {
            text: z.string().min(1),
            id: z.string().optional(),
            metadata: z.object({}).passthrough().optional()
        }
    },
    {
        name: "memory_query",
        internalName: "core.memoryQuery",
        description: "Search semantic memory for relevant project context.",
        inputSchema: {
            query: z.string().min(1),
            topK: z.number().int().positive().optional()
        }
    },
    {
        name: "llm_complete",
        internalName: "core.llmComplete",
        description: "Run an LLM completion through the mcp-server core.llmComplete tool.",
        inputSchema: {
            prompt: z.string().min(1),
            systemPrompt: z.string().optional(),
            model: z.string().optional(),
            response_format: z.union([
                z.literal("json"),
                z.literal("json_object"),
                z.object({}).passthrough()
            ]).optional()
        }
    }
];

export const EXCLUDED_MCP_STDIO_TOOLS = [
    {
        name: "project_status",
        internalName: "core.projectStatus",
        reason: "Excluded because the existing IO implementation executes the shell command tree."
    },
    {
        name: "scan_project",
        internalName: null,
        reason: "No safe existing non-mutating scan tool was identified for the stdio adapter."
    },
    {
        name: "run_command",
        internalName: "core.runCommand",
        reason: "Excluded because it executes shell commands."
    },
    {
        name: "write_file",
        internalName: "core.writeFile",
        reason: "Excluded because it mutates files."
    },
    {
        name: "db_query",
        internalName: "core.dbQuery",
        reason: "Excluded because it can access databases."
    }
];

export function getMcpStdioToolNames() {
    return MCP_STDIO_TOOL_DEFINITIONS.map((tool) => tool.name);
}

export function registerMcpStdioTools(server, options = {}) {
    for (const tool of MCP_STDIO_TOOL_DEFINITIONS) {
        server.registerTool(
            tool.name,
            {
                description: tool.description,
                inputSchema: tool.inputSchema
            },
            async (args) => {
                try {
                    const result = await callRegisteredTool(tool.internalName, args, options);
                    return jsonContent(result);
                } catch (err) {
                    return {
                        isError: true,
                        ...jsonContent(normalizeError(err))
                    };
                }
            }
        );
    }

    return server;
}
