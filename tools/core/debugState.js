import { mcpState } from "../../src/server/state.js";

export default async function core_debugState() {
    return {
        ok: true,
        lastContext: mcpState.lastContext
    };
}
