import { projectStatusLogic } from "./projectStatus.logic.js";
import { projectStatusIO } from "./projectStatus.io.js";

/**
 * Public MCP tool entry point
 */
export default async function projectStatus(params = {}) {
    return projectStatusLogic(params, projectStatusIO);
}
