import OpenAI from "openai";
import { ToolError } from "../../errors/ToolError.js";

export function normalizeResponseFormat(responseFormat) {
    if (responseFormat === "json" || responseFormat === "json_object") {
        return { type: "json_object" };
    }

    return responseFormat;
}

export function buildChatCompletionRequest({ prompt, systemPrompt, model, response_format }) {
    const messages = [];

    if (systemPrompt) {
        messages.push({ role: "system", content: systemPrompt });
    }

    messages.push({ role: "user", content: prompt });

    const request = {
        model,
        messages
    };

    const normalizedResponseFormat = normalizeResponseFormat(response_format);
    if (normalizedResponseFormat !== undefined) {
        request.response_format = normalizedResponseFormat;
    }

    return request;
}

export const llmCompleteIO = {
    async complete({ prompt, systemPrompt, model, response_format }) {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            throw new ToolError("OPENAI_KEY_MISSING", "OPENAI_API_KEY not set");
        }

        try {
            const client = new OpenAI({ apiKey });
            const request = buildChatCompletionRequest({ prompt, systemPrompt, model, response_format });

            const res = await client.chat.completions.create(request);
            const text = res.choices?.[0]?.message?.content?.trim();

            if (!text) {
                throw new Error("Empty AI response");
            }

            return { text };
        } catch (err) {
            if (err instanceof ToolError) throw err;

            throw new ToolError("AI_ERROR", "AI completion failed", {
                message: err.message
            });
        }
    }
};
