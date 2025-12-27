/**
 * Pure logic for snapshotTool.
 * Interprets context and builds snapshot instructions.
 */
export async function snapshotToolLogic(_params = {}, io) {
    try {
        const ctx = io.getLastContext();

        if (!ctx) {
            return { ok: false, message: "No lastContext available" };
        }

        const scanState = ctx.state?.scan;
        const collectedState = ctx.state?.collected;

        if (!scanState && !collectedState) {
            return {
                ok: false,
                message: "No executable project state (scan / collected) found"
            };
        }

        const projectRoot =
            scanState?.root ||
            collectedState?.root;

        if (!projectRoot) {
            return {
                ok: false,
                message: "Execution state missing project root"
            };
        }

        const projectName = io.basename(projectRoot);

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

        const snapshot = {
            project: projectName,
            generatedAt: io.nowISO(),
            ...snapshotPayload
        };

        const outPath = await io.writeSnapshot(projectRoot, projectName, snapshot);

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
