/**
 * Summarizes a file in 5–10 bullet points based on its content.
 * @param {Object} params - Parameters for the tool.
 * @param {string} params.file - The name of the file to summarize.
 * @returns {Promise<Object>} Result object.
 * @example
 * { "file": "example.txt" }
 */

import { readFile } from "fs/promises";
import path from "path";
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function summarizeFile(params = {}) {
    const { file } = params;
    const root = process.env.ETNOLENTOS_PATH;
    if (!root) throw new Error("ETNOLENTOS_PATH not set");
    if (!file) throw new Error("Missing 'file' parameter");

    const fullPath = path.resolve(root, file);
    const content = await readFile(fullPath, "utf8");

    const snippet = content.length > 8000 ? content.slice(0, 8000) + "\n[...truncated]" : content;

    const prompt = `
You are an expert in woodcraft, CNC, and design documentation.
Summarize the following Etno-Lentos file in 5–10 bullet points.
Focus on purpose, materials, CNC relevance, or conceptual ideas.

--- FILE START ---
${snippet}
--- FILE END ---
`;

    const res = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            { role: "system", content: "You are a concise summarizer for Etno-Lentos project files." },
            { role: "user", content: prompt },
        ],
    });

    return {
        file: file,
        path: fullPath,
        length: content.length,
        summary: res.choices[0].message.content.trim(),
    };
}