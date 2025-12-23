/**
 * core_snapshotTool
 *
 * Writes snapshot JSON for the PROJECT THAT WAS EXECUTED.
 * Snapshot is written into:
 *   <projectRoot>/headers/latest_<projectName>.json
 *
 * Supported modes:
 * - scan-project   → ctx.state.scan
 * - collect-files  → ctx.state.collected
 */

import fs from "fs/promises";
import path from "path";

export default async function core_snapshotTool() {
    try {
        const ctx = global.mcpState?.lastContext;

        if (!ctx) {
            return { ok: false, message: "No lastContext available" };
        }

        /**
         * 1️⃣ Resolve execution state (ONLY)
         */
        const scanState = ctx.state?.scan;
        const collectedState = ctx.state?.collected;

        if (!scanState && !collectedState) {
            return {
                ok: false,
                message: "No executable project state (scan / collected) found"
            };
        }

        /**
         * 2️⃣ Resolve project root (STATE ONLY)
         */
        const projectRoot =
            scanState?.root ||
            collectedState?.root;

        if (!projectRoot) {
            return {
                ok: false,
                message: "Execution state missing project root"
            };
        }

        const projectName = path.basename(projectRoot);

        /**
         * 3️⃣ Build snapshot payload
         */
        let snapshotPayload;

        if (scanState) {
            snapshotPayload = {
                mode: "scan-project",
                root: scanState.root,
                count: scanState.count,
                files: scanState.files
            };
        } else {
            snapshotPayload = {
                mode: "collect-files",
                root: collectedState.root,
                files: collectedState.files
            };
        }

        /**
         * 4️⃣ Ensure headers directory INSIDE PROJECT
         */
        const headersDir = path.join(projectRoot, "headers");
        await fs.mkdir(headersDir, { recursive: true });

        /**
         * 5️⃣ Write snapshot
         */
        const outPath = path.join(
            headersDir,
            `latest_${projectName}.json`
        );

        const snapshot = {
            project: projectName,
            generatedAt: new Date().toISOString(),
            ...snapshotPayload
        };

        await fs.writeFile(outPath, JSON.stringify(snapshot, null, 2), "utf8");

        return {
            ok: true,
            project: projectName,
            mode: snapshotPayload.mode,
            savedTo: outPath,
            fileCount: snapshotPayload.files.length
        };

    } catch (err) {
        return {
            ok: false,
            error: err.message
        };
    }
}
