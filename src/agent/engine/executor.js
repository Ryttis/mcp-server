/**
 * Universal Agent — Executor (v1)
 *
 * Responsible for:
 * - executing a pipeline of steps
 * - updating context state
 * - logging progress
 * - catching errors per-step
 *
 * Steps receive:
 *   - context
 *   - step options
 *
 * Steps must return:
 *   - (optional) mutations to apply to context
 */

import { updateContext } from "./context.js";
import { logStep, logError } from "../logging/logger.js";

/**
 * Execute a pipeline sequentially.
 * @param {object} context - RunContext
 * @param {Array<object>} pipeline - list of steps (with id, run)
 * @returns {Promise<object>} updated context
 */
export async function executePipeline(context, pipeline) {
    if (!Array.isArray(pipeline)) {
        throw new Error("Pipeline must be an array.");
    }

    for (const step of pipeline) {
        const id = step.id || "unknown";

        logStep(context, id, `BEGIN step`);

        try {
            // Steps must implement `run(context)`
            if (typeof step.run !== "function") {
                throw new Error(`Step '${id}' missing run()`);
            }

            const result = await step.run(context);

            // Steps may return { mutations: { ... } }
            if (result && result.mutations) {
                updateContext(context, result.mutations);
                logStep(context, id, `APPLIED mutations`);
            }

            logStep(context, id, `END step`);

        } catch (err) {
            const msg = err?.message || String(err);
            logError(context, `Step '${id}' failed: ${msg}`);

            // Record step failure
            context.errors.push(`STEP FAILED: ${id}`);

            // Stop execution on error
            break;
        }
    }

    return context;
}
