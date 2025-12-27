import { getTimeLogic } from "./getTime.logic.js";
import { getTimeIO } from "./getTime.io.js";

/**
 * Gets the current time in ISO format.
 * Public tool entry point.
 */
export default async function getTime(params = {}) {
    return getTimeLogic(params, getTimeIO);
}
