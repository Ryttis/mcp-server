import { parseMaterialLogic } from "./parseMaterial.logic.js";
import { parseMaterialIO } from "./parseMaterial.io.js";

/**
 * Parses material definition files for Etno-Lentos.
 * Public tool entry point.
 */
export default async function parseMaterialTool(params = {}) {
    return parseMaterialLogic(params, parseMaterialIO);
}
