import fs from "fs/promises";
import path from "path";

/**
 * IO layer for snapshotTool.
 * Handles filesystem access and system utilities.
 */
export const snapshotToolIO = {
    getLastContext() {
        return global.mcpState?.lastContext;
    },

    basename(p) {
        return path.basename(p);
    },

    nowISO() {
        return new Date().toISOString();
    },

    async writeSnapshot(projectRoot, projectName, snapshot) {
        const headersDir = path.join(projectRoot, "headers");
        await fs.mkdir(headersDir, { recursive: true });

        const outPath = path.join(
            headersDir,
            `latest_${projectName}.json`
        );

        await fs.writeFile(outPath, JSON.stringify(snapshot, null, 2), "utf8");
        return outPath;
    }
};
