/**
 * IO layer for core.memoryQuery tool.
 * Accepts:
 *  - "text"
 *  - ["text"]
 *  - { 0: "text" }
 *  - { query: "text", topK: 5 }
 */
export const memoryQueryIO = {
    validate(params) {
        if (typeof params === "string") {
            return { query: params, topK: 5 };
        }

        if (Array.isArray(params) && typeof params[0] === "string") {
            return { query: params[0], topK: 5 };
        }

        if (params && typeof params === "object" && typeof params[0] === "string") {
            return { query: params[0], topK: 5 };
        }

        if (params && typeof params.query === "string" && params.query.trim()) {
            return {
                query: params.query,
                topK: typeof params.topK === "number" ? params.topK : 5
            };
        }

        throw new Error("core.memoryQuery: 'query' string parameter is required");
    }
};
