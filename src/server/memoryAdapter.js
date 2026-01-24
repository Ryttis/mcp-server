import { ingestText, queryMemory } from "mcp-memory";

/**
 * Kernel adapter for MCP Memory (mirror mode).
 * Transforms raw vector hits into protocol-shaped context blocks.
 */

export async function memoryQuery({ query, topK = 5 }) {
    const results = await queryMemory(query, topK);

    return results.map(r => ({
        type: "mcp.context.memory",
        version: "v1",
        id: r.id,
        source: r.source || null,
        score: r.score,
        content: r.text,
        metadata: r.metadata || {}
    }));
}

export async function memoryIngest({ text, id = null, metadata = {} }) {
    const result = await ingestText(text, { id, metadata });
    return {
        ok: true,
        id: result.id
    };
}
