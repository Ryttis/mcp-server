import { readFile } from "fs/promises";
import OpenAI from "openai";
import { ToolError } from "../../errors/ToolError.js";
import { LIMITS } from "../../config/limits.js";

/**
 * IO layer for core.analyzeFile.
 */
export const analyzeFileIO = {
    async read(path) {
        const buf = await readFile(path);

        if (buf.length > LIMITS.MAX_FILE_SIZE) {
            throw new ToolError(
                "FILE_TOO_LARGE",
                `File exceeds max size ${LIMITS.MAX_FILE_SIZE} bytes`,
                { size: buf.length }
            );
        }

        return buf.toString("utf8");
    },

    async analyze(content) {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            throw new ToolError("OPENAI_KEY_MISSING", "OPENAI_API_KEY not set");
        }

        try {
            const client = new OpenAI({ apiKey });

            const res = await client.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: "You are an AI code analyst." },
                    { role: "user", content: `Analyze this file:\n\n${content}` }
                ]
            });

            const text = res.choices?.[0]?.message?.content?.trim();
            if (!text) {
                throw new Error("Empty AI response");
            }

            return text;
        } catch (err) {
            throw new ToolError("AI_ERROR", "AI analysis failed", {
                message: err.message
            });
        }
    }
};
