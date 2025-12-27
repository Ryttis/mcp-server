import { ToolError } from "../../errors/ToolError.js";

/**
 * Pure logic for etno.parseMaterial tool.
 * Validates input, parses by extension, normalizes and shapes output.
 */
export async function parseMaterialLogic(params = {}, io) {
    const { path: relPath } = params;
    const root = io.getRoot();

    if (!root) {
        throw new ToolError(
            "MISSING_ENV",
            "ETNOLENTOS_PATH not set"
        );
    }

    if (!relPath) {
        throw new ToolError(
            "INVALID_PARAMS",
            "Missing 'path' parameter",
            { expected: ["path"], received: Object.keys(params || {}) }
        );
    }

    const fullPath = io.resolvePath(root, relPath);
    const content = await io.read(fullPath);
    const ext = io.extname(fullPath);

    let materials = [];
    try {
        if (ext === ".yaml" || ext === ".yml") {
            materials = io.parseYaml(content);
        } else if (ext === ".json") {
            materials = io.parseJson(content);
        } else if (ext === ".csv") {
            materials = io.parseCsv(content);
        } else {
            throw new ToolError(
                "UNSUPPORTED_TYPE",
                `Unsupported file type: ${ext}`,
                { ext }
            );
        }
    } catch (e) {
        if (e instanceof ToolError) throw e;
        throw new ToolError(
            "PARSE_FAILED",
            "Parsing failed: " + e.message
        );
    }

    if (!Array.isArray(materials)) {
        throw new ToolError(
            "INVALID_FORMAT",
            "Expected array of materials"
        );
    }

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
