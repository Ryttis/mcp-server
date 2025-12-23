import path from "path";
import os from "os";

export function getDataDir() {
    return process.env.MCP_DATA_DIR ||
        path.join(os.homedir(), "mcp-data");
}
