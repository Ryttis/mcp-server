import fetch from "node-fetch";

/**
 * IO layer for checkBilling tool.
 * Handles env access and HTTP calls to OpenAI billing APIs.
 */
export const checkBillingIO = {
    getApiKey() {
        return process.env.OPENAI_API_KEY;
    },

    todayISO() {
        return new Date().toISOString().slice(0, 10);
    },

    async fetchSubscription(apiKey) {
        const res = await fetch(
            "https://api.openai.com/v1/dashboard/billing/subscription",
            {
                headers: { Authorization: `Bearer ${apiKey}` }
            }
        );
        return res.json();
    },

    async fetchUsage(apiKey, start, end) {
        const res = await fetch(
            `https://api.openai.com/v1/dashboard/billing/usage?start_date=${start}&end_date=${end}`,
            {
                headers: { Authorization: `Bearer ${apiKey}` }
            }
        );
        return res.json();
    }
};
