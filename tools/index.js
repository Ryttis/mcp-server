/**
 * MCP Server — Central Tool Registry (Kernel Only)
 *
 * Remote, immutable, side-effect free.
 * No filesystem, no OS, no project, no memory engines.
 */

import corePing from "./core/ping.js";
import coreGetTime from "./core/getTime.js";
import coreDebugState from "./core/debugState.js";
import coreDbQuery from "./core/dbQuery.js";
import coreCheckBilling from "./core/checkBilling.js";

export const TOOL_REGISTRY = [
    { name: "core.ping",         version: "1.0.0", handler: corePing },
    { name: "core.getTime",      version: "1.0.0", handler: coreGetTime },
    { name: "core.debugState",   version: "1.0.0", handler: coreDebugState },
    { name: "core.dbQuery",      version: "1.0.0", handler: coreDbQuery },
    { name: "core.checkBilling", version: "1.0.0", handler: coreCheckBilling },
];

export const TOOL_REGISTRY_MAP =
    TOOL_REGISTRY.reduce((acc, t) => {
        acc[t.name] = t;
        return acc;
    }, {});
