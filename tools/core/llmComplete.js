import { llmCompleteLogic } from "./llmComplete.logic.js";
import { llmCompleteIO } from "./llmComplete.io.js";

/**
 * Completes a prompt using the configured OpenAI model.
 * Public kernel tool entry point.
 */
export default async function llmComplete(params = {}) {
    return llmCompleteLogic(params, llmCompleteIO);
}
