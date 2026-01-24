/**
 * IO layer for core.memoryQuery tool.
 */
export const memoryQueryIO = {
    validate(params) {
        if (!params || typeof params.query !== "string" || !params.query.trim()) {
            throw new Error("core.memoryQuery: 'query' string parameter is required");
        }

        return {
            query: params.query,
            topK: typeof params.topK === "number" ? params.topK : 5
        };
    }
};
