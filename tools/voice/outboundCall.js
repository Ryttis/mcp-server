import { outboundCallLogic } from "./outboundCall.logic.js";
import { outboundCallIO } from "./outboundCall.io.js";

export default async function outboundCall(params = {}) {
    return outboundCallLogic(params, outboundCallIO);
}
