import { callStore } from "../../src/voice/callStore.js";

export const transcribeIO = {
    env: process.env,

    async getCall(callId) {
        return callStore.get(callId);
    },

    async saveCall(record) {
        return callStore.save(record);
    },

    fetch: globalThis.fetch
};
