/**
 * MCP Server — Central Tool Registry (v1)
 *
 * This file defines the frozen public surface of all tools exposed by mcp-server.
 * It is the single source of truth for:
 *  - tool names
 *  - versions
 *  - handlers
 *
 * No tool should be considered public unless it is listed here.
 */

import corePing from "./core/ping.js";
import coreGetTime from "./core/getTime.js";
import coreDebugState from "./core/debugState.js";
import coreProjectStatus from "./core/projectStatus.js";
import coreSnapshotServer from "./core/snapshotServer.js"
import coreSnapshotTool from "./core/snapshotTool.js";
import coreGetLastScan from "./core/getLastScan.js";
import coreSetLastContext from "./core/setLastContext.js";
import coreCache from "./core/cache.js";
import coreListDir from "./core/listDir.js";
import coreReadFile from "./core/readFile.js";
import coreReadProjectFile from "./core/readProjectFile.js";
import coreWriteFile from "./core/writeFile.js";
import coreRunCommand from "./core/runCommand.js";
import coreDbQuery from "./core/dbQuery.js";
import coreCheckBilling from "./core/checkBilling.js";
import coreLogParse from "./core/logParse.js";
import coreLogSummarize from "./core/logSummarize.js";
import coreAnalyzeGcode from "./core/analyzeGcode.js";
import coreAnalyzeFile from "./core/analyzeFile.js";

import etnoListDir from "./etno/listDir.js";
import etnoReadFile from "./etno/readFile.js";
import etnoSummarizeFile from "./etno/summarizeFile.js";
import etnoParseMaterial from "./etno/parseMaterial.js";

import facturaReadFile from "./factura/readFile.js";

export type ToolHandler = (input: any) => any | Promise<any>;


export interface ToolDefinition {
    name: string;
    version: string;
    handler: ToolHandler;
}

export const TOOL_REGISTRY: ToolDefinition[] = [
    // core
    { name: "core.ping", version: "1.0.0", handler: corePing },
    { name: "core.getTime", version: "1.0.0", handler: coreGetTime },
    { name: "core.debugState", version: "1.0.0", handler: coreDebugState },
    { name: "core.projectStatus", version: "1.0.0", handler: coreProjectStatus },
    { name: "core.snapshotServer", version: "1.0.0", handler: coreSnapshotServer },
    { name: "core.snapshotTool", version: "1.0.0", handler: coreSnapshotTool },
    { name: "core.getLastScan", version: "1.0.0", handler: coreGetLastScan },
    { name: "core.setLastContext", version: "1.0.0", handler: coreSetLastContext },
    { name: "core.cache", version: "1.0.0", handler: coreCache },
    { name: "core.listDir", version: "1.0.0", handler: coreListDir },
    { name: "core.readFile", version: "1.0.0", handler: coreReadFile },
    { name: "core.readProjectFile", version: "1.0.0", handler: coreReadProjectFile },
    { name: "core.writeFile", version: "1.0.0", handler: coreWriteFile },
    { name: "core.runCommand", version: "1.0.0", handler: coreRunCommand },
    { name: "core.dbQuery", version: "1.0.0", handler: coreDbQuery },
    { name: "core.checkBilling", version: "1.0.0", handler: coreCheckBilling },
    { name: "core.logParse", version: "1.0.0", handler: coreLogParse },
    { name: "core.logSummarize", version: "1.0.0", handler: coreLogSummarize },
    { name: "core.analyzeGcode", version: "1.0.0", handler: coreAnalyzeGcode },
    { name: "core.analyzeFile", version: "1.0.0", handler: coreAnalyzeFile },

    // etno
    { name: "etno.listDir", version: "1.0.0", handler: etnoListDir },
    { name: "etno.readFile", version: "1.0.0", handler: etnoReadFile },
    { name: "etno.summarizeFile", version: "1.0.0", handler: etnoSummarizeFile },
    { name: "etno.parseMaterial", version: "1.0.0", handler: etnoParseMaterial },

    // factura
    { name: "factura.readFile", version: "1.0.0", handler: facturaReadFile },
];

/**
 * Convenience map for fast lookup by name.
 */
export const TOOL_REGISTRY_MAP: Record<string, ToolDefinition> =
    TOOL_REGISTRY.reduce((acc, t) => {
        acc[t.name] = t;
        return acc;
    }, {} as Record<string, ToolDefinition>);

