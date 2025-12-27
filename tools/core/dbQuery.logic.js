/**
 * Pure logic for dbQuery tool.
 * Resolves SQL and shapes output.
 */
export async function dbQueryLogic(params = {}, io) {
    const sql = params.sql ?? "SELECT NOW() as time";
    const rows = await io.query(sql);
    return { rows };
}
