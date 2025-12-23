/**
 * Summarizes log files by parsing entries and generating a summary using GPT.
 * @param {Object} params - Parameters for the tool.
 * @param {string} params.path - File path or similar input.
 * @returns {Promise<Object>} Result object.
 * @example
 * { "id": 1, "method": "core_logSummarize", "params": { "path": "example.txt" } }
 */

import OpenAI from "openai";
import { parseLogFile } from "@ryttis/logpilot";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Tool: logSummarize
 * Reads log file → parses entries → sends to GPT → returns summary.
 * Params:
 *  - path: string  (path to log file)
 */
export default async function logSummarize(params = {}) {
    if (!params.path) throw new Error("Missing 'path' parameter");

    const entries = await parseLogFile(params.path);
    const text = entries
        .map(e => `${e.timestamp} ${e.level} ${e.message}`)
        .join("\n")
        .slice(-6000); // keep prompt within model limits

    const res = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            { role: "system", content: "You are an AI log analyst. Summarize patterns, errors, and notable events clearly." },
            { role: "user", content: text }
        ]
    });

    const summary = res.choices[0]?.message?.content?.trim() || "No summary generated.";
    return {
        message: `Summarized ${entries.length} entries from ${params.path}`,
        summary
    };
}