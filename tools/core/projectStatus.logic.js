/**
 * Pure logic for projectStatus tool.
 * Shapes output from provided IO data.
 */
export function projectStatusLogic(_params = {}, io) {
    const {
        timestamp,
        cwd,
        mcpState,
        workspaces,
        tree,
        files
    } = io.collect();

    return {
        timestamp,
        cwd,
        mcpState,
        workspaces,
        tree,
        files
    };
}
