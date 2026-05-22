#!/usr/bin/env node

import dotenv from "dotenv";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import packageJson from "../../package.json" with { type: "json" };
import { registerMcpStdioTools } from "./tools.js";

dotenv.config({ quiet: true });

export function createMcpStdioServer() {
    const server = new McpServer({
        name: "ryttis-mcp-server",
        version: packageJson.version || "0.1.0"
    });

    registerMcpStdioTools(server);
    return server;
}

export async function startMcpStdioServer() {
    const server = createMcpStdioServer();
    const transport = new StdioServerTransport();
    await server.connect(transport);
}

if (import.meta.url === `file://${process.argv[1]}`) {
    startMcpStdioServer().catch((err) => {
        console.error("[mcp-stdio] fatal:", err?.message || err);
        process.exit(1);
    });
}
