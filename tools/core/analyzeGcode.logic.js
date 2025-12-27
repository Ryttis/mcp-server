/**
 * Pure logic for analyzeGcode tool.
 * Parses G-code content and shapes output.
 */
export async function analyzeGcodeLogic(params = {}, io) {
    const { file } = params;

    const root = io.getRoot();
    if (!root) throw new Error("ETNOLENTOS_PATH not set");
    if (!file) throw new Error("Missing 'file' parameter");

    const fullPath = io.resolvePath(root, file);
    const content = await io.readFile(fullPath);

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
