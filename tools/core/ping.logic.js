/**
 * Pure logic for ping tool.
 * Shapes output from IO signal.
 */
export function pingLogic(_params = {}, io) {
    const msg = io.pong();
    return { message: msg };
}

