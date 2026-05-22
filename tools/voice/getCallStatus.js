import { getCallStatusLogic } from "./getCallStatus.logic.js";
import { getCallStatusIO } from "./getCallStatus.io.js";

export default async function getCallStatus(params = {}) {
    return getCallStatusLogic(params, getCallStatusIO);
}
