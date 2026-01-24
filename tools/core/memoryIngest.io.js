/**
 * IO layer for core.memoryIngest tool.
 * Accepts:
 *  - "text"
 *  - ["text"]
 *  - { 0: "text" }
 *  - { text: "text", id, metadata }
 */
export const memoryIngestIO = {
    validate(params) {
        if (typeof params === "string") {
            return { text: params, id: null, metadata: {} };
        }

        if (Array.isArray(params) && typeof params[0] === "string") {
            return { text: params[0], id: null, metadata: {} };
        }

        if (params && typeof params === "object" && typeof params[0] === "string") {
            return { text: params[0], id: null, metadata: {} };
        }

        if (params && typeof params.text === "string" && params.text.trim()) {
            return {
                text: params.text,
                id: typeof params.id === "string" ? params.id : null,
                metadata: typeof params.metadata === "object" && params.metadata !== null
                    ? params.metadata
                    : {}
            };
        }

        throw new Error("core.memoryIngest: 'text' string parameter is required");
    }
};
