/**
 * Pure logic for snapshotServer tool.
 * Delegates persistence to IO.
 */
export function snapshotServerLogic(state, io) {
    return io.save(state);
}
