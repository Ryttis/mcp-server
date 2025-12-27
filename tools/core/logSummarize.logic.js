/**
 * Pure logic for logSummarize tool.
 * Validates input, formats entries, and shapes output.
 */
export async function logSummarizeLogic(params = {}, io) {
    if (!params.path) throw new Error("Missing 'path' parameter");

    const entries = await io.parse(params.path);

    const text = entries
        .map(e => `${e.timestamp} ${e.level} ${e.message}`)
        .join("\n")
        .slice(-6000); // keep prompt within model limits

    const summary = await io.summarize(text);

    return {
        message: `Summarized ${entries.length} entries from ${params.path}`,
        summary
    };
}
