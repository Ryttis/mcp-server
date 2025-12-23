/**
 * Recipe Loader
 *
 * - Loads YAML recipes from disk
 * - Supports project recipes and built-in recipes
 */

import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import { logError, logStep } from "../logging/logger.js";

export async function loadRecipe(context, recipePath) {
    try {
        const abs = path.isAbsolute(recipePath)
            ? recipePath
            : path.join(context.options.rootPath, recipePath);

        const raw = await fs.promises.readFile(abs, "utf8");
        const recipe = yaml.load(raw);

        logStep(context, "recipe", `Loaded recipe ${recipe?.name || "(unnamed)"}`);

        return recipe;

    } catch (err) {
        logError(context, `Failed to load recipe: ${err}`);
        throw err;
    }
}
