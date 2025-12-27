/**
 * Pure logic for listDir tool.
 * Resolves defaults and shapes output.
 */
export function listDirLogic(params = {}, io) {
    const basePath = params.path || process.cwd();

    return io.list(basePath).then((files) => ({ files }));
}
