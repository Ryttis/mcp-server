import OpenAI from "openai";
import { parseLogFile } from "@ryttis/logpilot";

/**
 * IO layer for logSummarize tool.
 * Handles log parsing and OpenAI API calls.
 */
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const logSummarizeIO = {
    async parse(path) {
        return parseLogFile(path);
    },

    async summarize(text) {
        const res = await client.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content:
                        "You are an AI log analyst. Summarize patterns, errors, and notable events clearly."
                },
                { role: "user", content: text }
            ]
        });

        return (
            res.choices[0]?.message?.content?.trim() ||
            "No summary generated."
        );
    }
};
