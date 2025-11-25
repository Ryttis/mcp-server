/**
 * Universal Agent — Pipeline Builder (v1)
 *
 * Responsibilities:
 * - consume recipe definition (object already loaded from yaml/json)
 * - resolve step IDs to actual step implementations
 * - build final pipeline array for executor
 *
 * Steps are:
 *   {
 *     id: "selectFiles",
 *     run: async (context) => { ... }
 *   }
 *
 * Pipeline builder does NOT execute anything.
 */

import { loadPrimitiveStep } from "../steps/loader.js";
import { logInfo } from "../logging/logger.js";

/**
 * Build the pipeline from a recipe object.
 * @param {object} context
 * @param {object} recipe
 * @returns {Array<object>} pipeline
 */
export function buildPipeline(context, recipe) {
    if (!recipe || !Array.isArray(recipe.steps)) {
        throw new Error("Invalid recipe: missing steps[]");
    }

    logInfo(context, `Building pipeline for recipe '${recipe.name}'`);

    const pipeline = [];

    for (const stepDef of recipe.steps) {
        const id = stepDef.id;

        if (!id) {
            throw new Error("Recipe step missing id");
        }

        const stepImpl = loadPrimitiveStep(id);

        // Wrap into executor-compatible shape
        const step = {
            id,
            run: async (ctx) => {
                return await stepImpl.run(ctx, stepDef.options || {});
            }
        };

        pipeline.push(step);
    }

    logInfo(context, `Pipeline assembled with ${pipeline.length} steps`);

    return pipeline;
}
