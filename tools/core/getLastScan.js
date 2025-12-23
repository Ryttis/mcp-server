// tools/core/getLastScan.js
import { mcpState } from "../../src/server/state.js";

/**
 * core_getLastScan
 *
 * Grąžina paskutinį Universal Agent context.state.scan,
 * jei toks egzistuoja global.mcpState.lastContext.
 */
export default async function core_getLastScan() {
    try {
        const ctx = mcpState.lastContext;

        if (!ctx) {
            return {
                ok: false,
                message: "No lastContext found. Run a recipe first."
            };
        }

        const scan = ctx.state?.scan;

        if (!scan) {
            return {
                ok: false,
                message: "No scan data in lastContext."
            };
        }

        return {
            ok: true,
            scan
        };

    } catch (err) {
        return {
            ok: false,
            error: err.message
        };
    }
}
