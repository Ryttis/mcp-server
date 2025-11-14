import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";

/**
 * Dynamically loads all MCP tool modules from the specified directory (recursively)
 * and registers them into the global MCP state under `global.mcpState.tools`.
 *
 * Tools are discovered by scanning the provided base directory for `.js` files.
 * Each tool is registered using the pattern `<namespace>_<filename>`, where
 * the namespace corresponds to the directory structure.
 *
 * @async
 * @function loadTools
 * @param {string} dir - Directory path to load tools from.
 * @param {string} [namespace=""] - Optional namespace prefix (e.g. "core" or "etno").
 * @returns {Promise<void>} Resolves once all tools are imported and registered.
 *
 * @example
 * await loadTools("./tools", "core");
 * // Tools registered globally:
 * // global.mcpState.tools["core_ping"]
 * // global.mcpState.tools["core_readFile"]
 */
export async function loadTools(dir, namespace = "") {
    // ✅ Ensure global MCP state exists
    global.mcpState = global.mcpState || { tools: {}, startTime: new Date().toISOString() };
    global.mcpState.tools = global.mcpState.tools || {};

    const files = fs.readdirSync(dir, { withFileTypes: true });
    const importPromises = [];

    for (const file of files) {
        const fullPath = path.resolve(dir, file.name);

        if (file.isDirectory()) {
            importPromises.push(
                loadTools(fullPath, namespace ? `${namespace}_${file.name}` : file.name)
            );
            continue;
        }

        if (!file.name.endsWith(".js")) continue;

        const toolName = path.basename(file.name, ".js");
        const folderName = path.basename(path.dirname(fullPath));
        const prefix =
            namespace && !namespace.endsWith(folderName) ? namespace : folderName;
        const key = `${prefix}_${toolName}`;

        // ✅ Dynamically import the tool (ESM-safe)
        const promise = import(pathToFileURL(fullPath).href)
            .then((mod) => {
                const fn = mod[toolName] || mod.default;
                if (typeof fn === "function") {
                    global.mcpState.tools[key] = fn;
                    console.log(`✅ Loaded: ${key}`);
                }
            })
            .catch((err) => console.error(`❌ Failed: ${key}`, err));

        importPromises.push(promise);
    }

    // ✅ Wait for all imports to complete before returning
    await Promise.all(importPromises);
}
