import { callStore } from "../../src/voice/callStore.js";

export const getCallStatusIO = {
    async getCall(callId) {
        return callStore.get(callId);
    }
};
