import { dbQueryLogic } from "./dbQuery.logic.js";
import { dbQueryIO } from "./dbQuery.io.js";

/**
 * Executes a database query using the provided SQL statement.
 * Public tool entry point.
 */
export default async function dbQuery(params = {}) {
    return dbQueryLogic(params, dbQueryIO);
}
