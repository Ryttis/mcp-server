import test from "node:test";
import assert from "assert";

import {
    callRegisteredTool,
    EXCLUDED_MCP_STDIO_TOOLS,
    getMcpStdioToolNames,
    MCP_STDIO_TOOL_DEFINITIONS,
    registerMcpStdioTools
} from "../src/mcp/tools.js";
import { createMcpStdioServer } from "../src/mcp/stdio-server.js";

test("stdio server module imports without OPENAI_API_KEY", () => {
    const previous = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;

    const server = createMcpStdioServer();
    assert.ok(server);

    if (previous !== undefined) process.env.OPENAI_API_KEY = previous;
});

test("stdio adapter exposes only intended safe tools", () => {
    assert.deepEqual(getMcpStdioToolNames().sort(), [
        "llm_complete",
        "memory_ingest",
        "memory_query"
    ]);

    const exposed = new Set(getMcpStdioToolNames());
    assert.equal(exposed.has("run_command"), false);
    assert.equal(exposed.has("write_file"), false);
    assert.equal(exposed.has("db_query"), false);
    assert.equal(exposed.has("project_status"), false);
    assert.equal(exposed.has("scan_project"), false);
});

test("excluded stdio tools document dangerous or unavailable mappings", () => {
    const excluded = new Map(EXCLUDED_MCP_STDIO_TOOLS.map((tool) => [tool.name, tool]));
    assert.equal(excluded.get("run_command")?.internalName, "core.runCommand");
    assert.equal(excluded.get("write_file")?.internalName, "core.writeFile");
    assert.equal(excluded.get("db_query")?.internalName, "core.dbQuery");
    assert.match(excluded.get("project_status")?.reason || "", /executes/);
});

test("safe tool wrapper rejects unknown internal tool", async () => {
    await assert.rejects(
        () => callRegisteredTool("core.missing", {}, { registry: {}, timeoutMs: 50 }),
        (err) => err.code === "UNKNOWN_TOOL"
    );
});

test("safe tool wrapper rejects dangerous internal tools", async () => {
    for (const name of ["core.runCommand", "core.writeFile", "core.dbQuery"]) {
        await assert.rejects(
            () => callRegisteredTool(name, {}, { registry: { [name]: async () => ({ ok: true }) }, timeoutMs: 50 }),
            (err) => err.code === "FORBIDDEN_TOOL"
        );
    }
});

test("memory_ingest wrapper can call mocked internal tool", async () => {
    const result = await callRegisteredTool(
        "core.memoryIngest",
        { text: "hello", id: "m1" },
        {
            timeoutMs: 50,
            registry: {
                "core.memoryIngest": {
                    async handler(params) {
                        assert.deepEqual(params, { text: "hello", id: "m1" });
                        return { ok: true, id: "m1" };
                    }
                }
            }
        }
    );

    assert.deepEqual(result, { ok: true, id: "m1" });
});

test("llm_complete wrapper can call mocked internal tool", async () => {
    const result = await callRegisteredTool(
        "core.llmComplete",
        { prompt: "hi" },
        {
            timeoutMs: 50,
            registry: {
                "core.llmComplete": async (params) => {
                    assert.deepEqual(params, { prompt: "hi" });
                    return { text: "hello" };
                }
            }
        }
    );

    assert.deepEqual(result, { text: "hello" });
});

test("tool definitions can be registered on an MCP-like server", () => {
    const registrations = [];
    const fakeServer = {
        registerTool(name, config, handler) {
            registrations.push({ name, config, handler });
        }
    };

    registerMcpStdioTools(fakeServer, { registry: {}, timeoutMs: 50 });

    assert.equal(registrations.length, MCP_STDIO_TOOL_DEFINITIONS.length);
    assert.deepEqual(registrations.map((entry) => entry.name).sort(), getMcpStdioToolNames().sort());
    for (const entry of registrations) {
        assert.equal(typeof entry.config.description, "string");
        assert.ok(entry.config.inputSchema);
        assert.equal(typeof entry.handler, "function");
    }
});
