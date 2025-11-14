import fs from 'fs';
import path from 'path';

/**
 * Saves current MCP state snapshot into /headers/latest.md
 * and returns metadata for logging or API response.
 */
export async function snapshotServer(state) {
    try {
        const baseDir = path.resolve('./');
        const headersDir = path.join(baseDir, 'headers');
        if (!fs.existsSync(headersDir)) fs.mkdirSync(headersDir, { recursive: true });

        const headersPath = path.join(headersDir, 'latest.md');
        const content = [
            `# MCP Snapshot — ${new Date().toISOString()}`,
            '```json',
            JSON.stringify(state, null, 2),
            '```'
        ].join('\n\n');

        fs.writeFileSync(headersPath, content, 'utf-8');
        return { status: 'ok', path: headersPath };
    } catch (err) {
        console.error('❌ snapshotServer error:', err);
        return { status: 'error', message: err.message };
    }
}
