import { writeFile as fsWriteFile } from "fs/promises";

/**
 * IO layer for writeFile tool.
 * Handles filesystem writes only.
 */
export const writeFileIO = {
    async write(path, content) {
        return fsWriteFile(path, content, "utf8");
    }
};
