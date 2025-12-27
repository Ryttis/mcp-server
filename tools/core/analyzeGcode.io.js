import { readFile as fsReadFile } from "fs/promises";
import path from "path";

/**
 * IO layer for analyzeGcode tool.
 * Handles env, path resolution and filesystem access.
 */
export const analyzeGcodeIO = {
    getRoot() {
        return process.env.ETNOLENTOS_PATH;
    },

    resolvePath(root, file) {
        return path.resolve(root, file);
    },

    async readFile(fullPath) {
        return fsReadFile(fullPath, "utf8");
    }
};
