import { listDirLogic } from "./listDir.logic.js";
import { listDirIO } from "./listDir.io.js";

/**
 * Lists directory contents.
 * Public tool entry point.
 */
export default async function listDirTool(params = {}) {
    return listDirLogic(params, listDirIO);
}
