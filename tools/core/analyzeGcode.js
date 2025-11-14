import { readFile } from "fs/promises";
import path from "path";

/**
 * Reads a .gcode or .nc file and extracts key machining parameters:
 * spindle speeds (S-codes), feed rates (F-codes), depths (Z values), and tool changes (T-codes).
 * @param {Object} params - Parameters for the tool.
 * @param {string} params.file - File path or similar input.
 * @returns {Promise<Object>} Result object.
 * @example
 * { "id": 1, "method": "core_analyzeGcode", "params": { "file": "example.gcode" } }
 */
export default async function analyzeGcode(params = {}) {
    const { file } = params;
    const root = process.env.ETNOLENTOS_PATH;
    if (!root) throw new Error("ETNOLENTOS_PATH not set");
    if (!file) throw new Error("Missing 'file' parameter");

    const fullPath = path.resolve(root, file);
    const content = await readFile(fullPath, "utf8");
    const lines = content.split(/\r?\n/).filter(Boolean);

    const speeds = new Set();
    const feeds = new Set();
    const depths = [];
    const tools = new Set();

    for (const line of lines) {
        const s = line.match(/\bS(\d+(\.\d+)?)/i);
        if (s) speeds.add(Number(s[1]));

        const f = line.match(/\bF(\d+(\.\d+)?)/i);
        if (f) feeds.add(Number(f[1]));

        const z = line.match(/\bZ(-?\d+(\.\d+)?)/i);
        if (z) depths.push(Number(z[1]));

        const t = line.match(/\bT(\d+)/i);
        if (t) tools.add(Number(t[1]));
    }

    const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null);
    const min = (arr) => (arr.length ? Math.min(...arr) : null);
    const max = (arr) => (arr.length ? Math.max(...arr) : null);

    return {
        file,
        path: fullPath,
        lineCount: lines.length,
        toolCount: tools.size,
        spindleSpeeds: Array.from(speeds),
        feedRates: Array.from(feeds),
        depthRange: {
            min: min(depths),
            max: max(depths),
            avg: avg(depths),
        },
        sample: lines.slice(0, 10),
    };
}