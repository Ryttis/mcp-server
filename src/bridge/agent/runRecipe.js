/**
 * runRecipe.js
 *
 * Bridge entry point for Universal Agent v1.
 * Loads recipe, runs pipeline, prints summary.
 */

import { loadRecipe } from "../../agent/recipes/loader.js";
import { validateRecipe } from "../../agent/recipes/validator.js";
import { createContext } from "../../agent/engine/context.js";
import { buildPipeline } from "../../agent/engine/pipeline.js";
import { executePipeline } from "../../agent/engine/executor.js";
import path from "path";
import fs from "fs";

export async function runRecipe(recipeName, targetPath, options = {}) {
    const rootPath = process.cwd();
    const absPath = targetPath
        ? path.resolve(targetPath)
        : rootPath;

    // Create context
    const context = createContext({
        verbose: true,
        rootPath,
        targetFiles: [absPath],
        ...options
    });

    // Determine recipe location
    const builtinPath = path.join(rootPath, "src/agent/recipes/builtin", `${recipeName}.yaml`);
    const projectPath = path.join(rootPath, `.ai/recipes`, `${recipeName}.yaml`);

    let recipeFile = null;

    if (fs.existsSync(projectPath)) {
        recipeFile = projectPath;
    } else if (fs.existsSync(builtinPath)) {
        recipeFile = builtinPath;
    } else {
        throw new Error(`Recipe '${recipeName}' not found in builtin or .ai/recipes.`);
    }

    // Load recipe
    const recipe = await loadRecipe(context, recipeFile);

    // Validate recipe structure
    validateRecipe(context, recipe);

    // Build pipeline
    const pipeline = buildPipeline(context, recipe);

    // Execute
    await executePipeline(context, pipeline);

    console.log("✔️ Recipe completed.");
    return context;
}
