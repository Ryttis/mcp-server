/**
 * Pure logic for getTime tool.
 * Shapes output from a provided time source.
 */
export function getTimeLogic(_params = {}, io) {
    const now = io.now();
    return { time: now.toISOString() };
}
