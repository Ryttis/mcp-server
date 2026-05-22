import test from "node:test";
import assert from "assert";
import { validateToolOutput } from "mcp-protocol";
import { memoryIngestLogic } from "../../tools/core/memoryIngest.logic.js";
import { memoryQueryLogic } from "../../tools/core/memoryQuery.logic.js";

test("core.memoryIngest shapes mcp-memory ingest result", async () => {
    const result = await memoryIngestLogic(
        { text: "hello", id: "known-id", metadata: { source: "test" } },
        {
            async ingestText(text, options) {
                assert.equal(text, "hello");
                assert.deepEqual(options, {
                    id: "known-id",
                    metadata: { source: "test" }
                });
                return { ok: true, id: "known-id" };
            }
        }
    );

    assert.deepEqual(result, { ok: true, id: "known-id" });
    assert.equal(validateToolOutput("core.memoryIngest", result).ok, true);
});

test("core.memoryIngest accepts generated mcp-memory id shape", async () => {
    const result = await memoryIngestLogic(
        { text: "hello", metadata: { source: "test" } },
        {
            async ingestText(text, options) {
                assert.equal(text, "hello");
                assert.deepEqual(options, {
                    id: undefined,
                    metadata: { source: "test" }
                });
                return { ok: true, id: "test-id" };
            }
        }
    );

    assert.deepEqual(result, { ok: true, id: "test-id" });
    assert.equal(validateToolOutput("core.memoryIngest", result).ok, true);
});

test("core.memoryIngest rejects mcp-memory null id result", async () => {
    await assert.rejects(
        () => memoryIngestLogic(
            { text: "hello", metadata: { source: "test" } },
            {
                async ingestText() {
                    return { ok: true, id: null };
                }
            }
        ),
        (err) => err.code === "MEMORY_ERROR"
    );
});

test("core.memoryQuery returns protocol-compatible object shape", async () => {
    const result = await memoryQueryLogic(
        { query: "hello", topK: 2 },
        {
            async queryMemory(query, topK) {
                assert.equal(query, "hello");
                assert.equal(topK, 2);
                return { results: [] };
            }
        }
    );

    assert.deepEqual(result, { results: [] });
    assert.equal(validateToolOutput("core.memoryQuery", result).ok, true);
});

test("core.memoryQuery rejects missing query", async () => {
    await assert.rejects(
        () => memoryQueryLogic({}, { async queryMemory() {} }),
        (err) => err.code === "INVALID_INPUT"
    );
});
