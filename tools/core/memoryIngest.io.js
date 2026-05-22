import { ingestText } from "mcp-memory";

export const memoryIngestIO = {
    async ingestText(text, options) {
        return ingestText(text, options);
    }
};
