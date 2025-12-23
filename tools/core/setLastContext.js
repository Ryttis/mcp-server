import { mcpState } from "../../src/server/state.js";

/**
 * core_setLastContext
 *
 * Kviečiamas iš Bridge:
 *   await callMCP("core_setLastContext", { context });
 */
export default async function core_setLastContext(params = {}) {
    const { context } = params || {};

    if (!context) {
        return {
            ok: false,
            message: "Missing 'context' in params. Use { context }.",
        };
    }

    // ČIA – vienintelė vieta, kur atnaujinam serverio lastContext:
    mcpState.lastContext = context;

    return {
        ok: true,
        saved: true,
        timestamp: new Date().toISOString(),
    };
}
