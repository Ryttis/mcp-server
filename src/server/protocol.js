import protocol from "mcp-protocol";

const MODE = process.env.MCP_PROTOCOL_MODE || "mirror";

export const MCP_PROTOCOL = {
    name: "mcp-protocol",
    version: protocol.PROTOCOL_VERSION || "v1",
    mode: MODE,
    enforcement: MODE === "enforce",
    paths: protocol.paths
};

export default MCP_PROTOCOL;
