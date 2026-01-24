/**
 * IO layer for core.memoryIngest tool.
 */
export const memoryIngestIO = {
    validate(params) {
        if (!params || typeof params.text !== "string" || !params.text.trim()) {
            throw new Error("core.memoryIngest: 'text' string parameter is required");
        }

        return {
            text: params.text,
            id: typeof params.id === "string" ? params.id : null,
            metadata: typeof params.metadata === "object" && params.metadata !== null
                ? params.metadata
                : {}
        };
    }
};
