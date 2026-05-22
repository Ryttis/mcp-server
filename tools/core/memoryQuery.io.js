import { queryMemory } from "mcp-memory";

export const memoryQueryIO = {
    async queryMemory(query, topK) {
        return queryMemory(query, topK);
    }
};
