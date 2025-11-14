#!/usr/bin/env node
/**
 * 🤖 MCP Bridge — v2.1 (Top-Level Await Fix)
 *
 * Modes:
 *   node bridge.js                  → interactive mode
 *   node bridge.js analyze <file>   → analyze file via ChatGPT
 *   node bridge.js improve <file> "instructions..." → AI-refactor file (with .bak backup)
 */

import dotenv from "dotenv";
dotenv.config();

import { analyzeFile } from "./src/bridge/analyzer.js";
import { startInteractiveBridge } from "./src/bridge/interactive.js";
import { listTools } from "./src/bridge/utils.js";
import { improveFile } from "./src/bridge/agent.js";

const SERVER_URL = "ws://localhost:4000";
const TOKEN = process.env.AUTH_TOKEN;
const FULL_URL = `${SERVER_URL}?token=${TOKEN}`;

if (!TOKEN) {
    console.error("❌ Missing MCP_AUTH_TOKEN in .env");
    process.exit(1);
}

// Parse CLI args
const [,, command, ...args] = process.argv;

// ✅ Wrap everything inside an async IIFE to safely use await
(async () => {
    switch (command) {
        // 🧠 Analyze a file
        case "analyze": {
            const target = args[0];
            if (!target) {
                console.error("❌ Missing file path.\nUsage: node bridge.js analyze <file>");
                process.exit(1);
            }
            await analyzeFile(SERVER_URL, TOKEN, target);
            break;
        }

        // 🔧 Improve (refactor) a file using AI agent
        case "improve": {
            const target = args[0];
            if (!target) {
                console.error("❌ Missing file path.\nUsage: node bridge.js improve <file> [instructions]");
                process.exit(1);
            }
            const note = args.slice(1).join(" ") || "Refactor for clarity and maintainability.";
            await improveFile(target, note);
            break;
        }

        // 💬 Default — interactive mode
        default: {
            console.log("🧩 MCP Interactive Bridge");
            console.log("Commands:");
            console.log("  analyze <file>          → Analyze file with ChatGPT");
            console.log("  improve <file> [text]   → AI-refactor file (backup saved)");
            console.log("  (no args)               → Enter interactive JSON-RPC console\n");
            await listTools(FULL_URL);
            startInteractiveBridge(FULL_URL);
        }
    }
})();
