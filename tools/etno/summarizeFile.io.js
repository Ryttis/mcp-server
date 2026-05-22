import { readFile as fsReadFile } from "fs/promises";
import path from "path";
import OpenAI from "openai";
import { ToolError } from "../../errors/ToolError.js";

/**
 * IO layer for etno.summarizeFile tool.
 * Handles env access, filesystem reads, and OpenAI API calls.
 */
export const summarizeFileIO = {
    getRoot() {
        return process.env.ETNOLENTOS_PATH;
    },

    resolvePath(root, file) {
        return path.resolve(root, file);
    },

    async read(fullPath) {
        return fsReadFile(fullPath, "utf8");
    },

    async summarize(prompt) {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            throw new ToolError("OPENAI_KEY_MISSING", "OPENAI_API_KEY not set");
        }

        const client = new OpenAI({ apiKey });
        const res = await client.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: "You are a concise summarizer for Etno-Lentos project files."
                },
                { role: "user", content: prompt },
            ],
        });

        return res.choices[0].message.content;
    }
};
