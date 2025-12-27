import { readFile as fsReadFile } from "fs/promises";
import path from "path";
import yaml from "yaml";
import { parse as csvParse } from "csv-parse/sync";

/**
 * IO layer for etno.parseMaterial tool.
 * Handles env access, filesystem reads and format parsing.
 */
export const parseMaterialIO = {
    getRoot() {
        return process.env.ETNOLENTOS_PATH;
    },

    resolvePath(root, relPath) {
        return path.resolve(root, relPath);
    },

    extname(p) {
        return path.extname(p).toLowerCase();
    },

    async read(fullPath) {
        return fsReadFile(fullPath, "utf8");
    },

    parseYaml(content) {
        return yaml.parse(content);
    },

    parseJson(content) {
        return JSON.parse(content);
    },

    parseCsv(content) {
        return csvParse(content, { columns: true, skip_empty_lines: true });
    }
};
