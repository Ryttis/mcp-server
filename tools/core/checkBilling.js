import { checkBillingLogic } from "./checkBilling.logic.js";
import { checkBillingIO } from "./checkBilling.io.js";

/**
 * Returns OpenAI prepaid balance and usage.
 * Public tool entry point.
 */
export default async function checkBilling(params = {}) {
    return checkBillingLogic(params, checkBillingIO);
}
