import { callStore } from "../../src/voice/callStore.js";

export const outboundCallIO = {
    env: process.env,

    async saveCall(record) {
        return callStore.save(record);
    },

    async createTwilioClient(env) {
        const { default: twilio } = await import("twilio");
        return twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
    }
};
