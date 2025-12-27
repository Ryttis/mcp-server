import { readFile as fsReadFile } from "fs/promises";
import path from "path";
import OpenAI from "openai";

/**
 * IO layer for etno.summarizeFile tool.
 * Handles env access, filesystem reads, and OpenAI API calls.
 */
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
