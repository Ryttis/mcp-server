/**
 * Pure logic for runCommand tool.
 * Shapes output and delegates execution to IO.
 */
export function runCommandLogic(params = {}, io) {
    const cmd = params.cmd ?? "";

    return io.exec(cmd).then((stdout) => ({
        output: stdout.trim()
    }));
}
