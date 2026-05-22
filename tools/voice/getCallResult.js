import { getCallResultLogic } from "./getCallResult.logic.js";
import { getCallResultIO } from "./getCallResult.io.js";

export default async function getCallResult(params = {}) {
    return getCallResultLogic(params, getCallResultIO);
}
