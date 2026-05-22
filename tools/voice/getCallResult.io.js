import { callStore } from "../../src/voice/callStore.js";

export const getCallResultIO = {
    async getCall(callId) {
        return callStore.get(callId);
    }
};
