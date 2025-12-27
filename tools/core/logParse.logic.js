/**
 * Pure logic for logParse tool.
 * Validates input and shapes output.
 */
export async function logParseLogic(params = {}, io) {
    if (!params.path) {
        throw new Error("Missing 'path' parameter");
    }

    const entries = await io.parse(params.path);

    return {
        message: `Parsed ${entries.length} entries from ${params.path}`,
        count: entries.length,
        sample: entries.slice(0, 10),
    };
}
