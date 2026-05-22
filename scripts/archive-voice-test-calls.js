#!/usr/bin/env node
/**
 * Archive test voice call records from data/voice-calls to data/voice-calls-archive/<timestamp>/.
 *
 * Usage:
 *   node scripts/archive-voice-test-calls.js --dry-run     (preview what would be moved)
 *   node scripts/archive-voice-test-calls.js --confirm     (actually move the files)
 *
 * Matches: mock-call-*.json and twilio-call-*.json
 * Does NOT run automatically. Requires explicit invocation.
 */

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SOURCE_DIR = path.join(ROOT, "data", "voice-calls");
const ARCHIVE_BASE = path.join(ROOT, "data", "voice-calls-archive");

const TEST_CALL_PATTERN = /^(mock-call-|twilio-call-).+\.json$/;

async function listTestCallFiles(dir) {
    let entries;
    try {
        entries = await fs.readdir(dir);
    } catch (err) {
        if (err.code === "ENOENT") return [];
        throw err;
    }
    return entries.filter((name) => TEST_CALL_PATTERN.test(name));
}

async function run() {
    const args = process.argv.slice(2);
    const dryRun = args.includes("--dry-run");
    const confirm = args.includes("--confirm");

    if (!dryRun && !confirm) {
        console.error("Usage: node scripts/archive-voice-test-calls.js [--dry-run | --confirm]");
        process.exit(1);
    }

    const files = await listTestCallFiles(SOURCE_DIR);

    if (files.length === 0) {
        console.log("No test call records found in", SOURCE_DIR);
        return;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").replace("T", "_").slice(0, 19);
    const archiveDir = path.join(ARCHIVE_BASE, timestamp);

    console.log(`Found ${files.length} test call record(s) in ${SOURCE_DIR}`);
    console.log(`Archive destination: ${archiveDir}`);
    console.log();

    for (const file of files) {
        const src = path.join(SOURCE_DIR, file);
        const dest = path.join(archiveDir, file);
        if (dryRun) {
            console.log(`[dry-run] ${src} → ${dest}`);
        } else {
            console.log(`Moving: ${src} → ${dest}`);
        }
    }

    if (dryRun) {
        console.log("\nDry run complete. Run with --confirm to move the files.");
        return;
    }

    await fs.mkdir(archiveDir, { recursive: true });

    let moved = 0;
    for (const file of files) {
        const src = path.join(SOURCE_DIR, file);
        const dest = path.join(archiveDir, file);
        await fs.rename(src, dest);
        moved++;
    }

    console.log(`\nArchived ${moved} file(s) to ${archiveDir}`);
}

run().catch((err) => {
    console.error("Archive failed:", err.message);
    process.exit(1);
});
