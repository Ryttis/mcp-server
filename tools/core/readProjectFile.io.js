import { readFile as fsReadFile } from "fs/promises";
import path from "path";

/**
 * IO layer for readProjectFile tool.
 * Handles env access, path resolution and filesystem reads.
 */
export const readProjectFileIO = {
    getRoot() {
        return process.env.FACTURACORE_PATH;
    },

    resolvePath(root, file) {
        return path.join(root, file);
    },

    async read(filePath) {
        return fsReadFile(filePath, "utf8");
    }
};
