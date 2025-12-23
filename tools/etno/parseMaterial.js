import { readFile } from "fs/promises";
import path from "path";
import yaml from "yaml";
import { parse as csvParse } from "csv-parse/sync";

/**
 * Parses a material definition file (.yaml, .json, or .csv)
 * and returns normalized structured data.
 * @param {Object} params - Parameters for the tool.
 * @param {string} params.path - Path (relative to ETNOLENTOS_PATH) of the material file.
 * @returns {Promise<Object>} Structured material data.
 * @example
 * { "id": 1, "method": "etno_parseMaterial", "params": { "path": "materials/wood.yaml" } }
 */
export default async function parseMaterialTool(params = {}) {
    const { path: relPath } = params;
    const root = process.env.ETNOLENTOS_PATH;
    if (!root) throw new Error("ETNOLENTOS_PATH not set");
    if (!relPath) throw new Error("Missing 'path' parameter");

    const fullPath = path.resolve(root, relPath);
    const content = await readFile(fullPath, "utf8");
    const ext = path.extname(fullPath).toLowerCase();

    let materials = [];
    try {
        if (ext === ".yaml" || ext === ".yml") {
            materials = yaml.parse(content);
        } else if (ext === ".json") {
            materials = JSON.parse(content);
        } else if (ext === ".csv") {
            materials = csvParse(content, { columns: true, skip_empty_lines: true });
        } else {
            throw new Error(`Unsupported file type: ${ext}`);
        }
    } catch (e) {
        throw new Error("Parsing failed: " + e.message);
    }

    if (!Array.isArray(materials)) throw new Error("Expected array of materials");

    const normalized = materials.map((m) => ({
        name: m.name || m.material || "Unknown",
        density: Number(m.density) || null,
        grain: m.grain || m.texture || null,
        thickness: Number(m.thickness) || null,
        finish: m.finish || null,
        color: m.color || null,
    }));

    return {
        path: fullPath,
        materialCount: normalized.length,
        sample: normalized.slice(0, 5),
    };
}