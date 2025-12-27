import { ToolError } from "../../errors/ToolError.js";

/**
 * Pure logic for getLastScan tool.
 * Interprets context and shapes output.
 */
export async function getLastScanLogic(_params = {}, io) {
    const ctx = io.getLastContext();

    if (!ctx) {
        throw new ToolError(
            "CONTEXT_NOT_FOUND",
            "No lastContext found. Run a recipe first."
        );
    }

    const scan = ctx.state?.scan;

    if (!scan) {
        throw new ToolError(
            "SCAN_NOT_FOUND",
            "No scan data in lastContext."
        );
    }

    return {
        ok: true,
        scan
    };
}
