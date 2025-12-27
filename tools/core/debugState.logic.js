/**
 * Pure logic for debugState tool.
 * Shapes output from provided state.
 */
export function debugStateLogic(_params = {}, io) {
    const state = io.getState();

    return {
        ok: true,
        lastContext: state.lastContext
    };
}
