# MCP Server — Tool Surface (v1)

Version: v1.0 (Frozen)
Status: Stable Infrastructure Surface  
Owner: MCP Server Kernel

This document defines the complete public tool surface exposed by **mcp-server**.
All tools listed here are considered **v1 stable**.

Rules:
- No renaming of tools.
- No breaking input/output changes.
- New tools require a new milestone and explicit decision.
- Deprecations must be documented here before removal.

---

## 🔒 Versioning & Stability

- All tools in this document are **v1**.
- Backward compatibility is required.
- Any breaking change implies a future **v2** milestone.
- Deprecated tools must:
    - be marked here,
    - remain for at least one milestone,
    - provide a replacement.

---

## 📦 Tool Groups

- **core/** — generic infrastructure and system tools
- **etno/** — Etno Lentos / CNC-related domain tools
- **factura/** — FacturaCore / ERP-related domain tools

---

## 🛠 Tool Index

### core
- core.ping
- core.getTime
- core.debugState
- core.projectStatus
- core.snapshotServer
- core.snapshotTool
- core.getLastScan
- core.setLastContext
- core.cache
- core.listDir
- core.readFile
- core.readProjectFile
- core.writeFile
- core.runCommand
- core.dbQuery
- core.checkBilling
- core.logParse
- core.logSummarize
- core.analyzeGcode

### etno
- etno.listDir
- etno.readFile
- etno.summarizeFile
- etno.parseMaterial

### factura
- factura.readFile

---

## 📘 Tool Contracts

> All tools must eventually conform to:
> - explicit input schema
> - explicit output schema
> - standardized ToolError errors

Below are the frozen v1 contracts (to be refined in later steps without breaking changes).

---

### core.ping

**Description:** Health check tool. Confirms server is alive.

- **Input:** none
- **Output:** `{ ok: boolean }`
- **Errors:** none

---

### core.getTime

**Description:** Returns current server time.

- **Input:** none
- **Output:** `{ iso: string, timestamp: number }`
- **Errors:** ToolError[TIME_ERROR]

---

### core.debugState

**Description:** Returns internal debug information about server state.

- **Input:** none
- **Output:** `object`
- **Errors:** ToolError[INTERNAL_ERROR]

---

### core.projectStatus

**Description:** Returns status of current project/workspace.

- **Input:** `{ root?: string }`
- **Output:** `object`
- **Errors:** ToolError[INVALID_ROOT, INTERNAL_ERROR]

---

### core.snapshotServer

**Description:** Creates a snapshot of server state.

- **Input:** `{}`
- **Output:** `{ snapshotId: string }`
- **Errors:** ToolError[SNAPSHOT_FAILED]

---

### core.snapshotTool

**Description:** Creates a snapshot via tool-level logic.

- **Input:** `{}`
- **Output:** `{ snapshotId: string }`
- **Errors:** ToolError[SNAPSHOT_FAILED]

---

### core.getLastScan

**Description:** Returns metadata about last project scan.

- **Input:** none
- **Output:** `object | null`
- **Errors:** ToolError[INTERNAL_ERROR]

---

### core.setLastContext

**Description:** Sets last known context/state reference.

- **Input:** `{ context: object }`
- **Output:** `{ ok: boolean }`
- **Errors:** ToolError[INVALID_INPUT, INTERNAL_ERROR]

---

### core.cache

**Description:** Cache helper for storing/retrieving temporary values.

- **Input:** `{ key: string, value?: any, action: "get" | "set" | "clear" }`
- **Output:** `{ value?: any }`
- **Errors:** ToolError[CACHE_ERROR]

---

### core.listDir

**Description:** Lists directory contents.

- **Input:** `{ path: string }`
- **Output:** `{ entries: string[] }`
- **Errors:** ToolError[INVALID_PATH, FS_ERROR]

---

### core.readFile

**Description:** Reads a file from disk.

- **Input:** `{ path: string }`
- **Output:** `{ content: string }`
- **Errors:** ToolError[INVALID_PATH, FS_ERROR, FILE_TOO_LARGE]

---

### core.readProjectFile

**Description:** Reads a file relative to project root.

- **Input:** `{ path: string }`
- **Output:** `{ content: string }`
- **Errors:** ToolError[INVALID_PATH, FS_ERROR]

---

### core.writeFile

**Description:** Writes content to a file.

- **Input:** `{ path: string, content: string }`
- **Output:** `{ ok: boolean }`
- **Errors:** ToolError[INVALID_PATH, FS_ERROR, FILE_TOO_LARGE]

---

### core.runCommand

**Description:** Runs a shell command.

- **Input:** `{ command: string, args?: string[] }`
- **Output:** `{ stdout: string, stderr: string, code: number }`
- **Errors:** ToolError[COMMAND_FAILED, TIMEOUT]

---

### core.dbQuery

**Description:** Executes a database query.

- **Input:** `{ query: string, params?: any[] }`
- **Output:** `{ rows: any[] }`
- **Errors:** ToolError[DB_ERROR]

---

### core.checkBilling

**Description:** Checks billing or license status.

- **Input:** none
- **Output:** `object`
- **Errors:** ToolError[BILLING_ERROR]

---

### core.logParse

**Description:** Parses log file into structured entries.

- **Input:** `{ path: string }`
- **Output:** `{ entries: object[] }`
- **Errors:** ToolError[INVALID_PATH, FS_ERROR]

---

### core.logSummarize

**Description:** Summarizes parsed logs.

- **Input:** `{ path: string }`
- **Output:** `{ summary: object }`
- **Errors:** ToolError[INVALID_PATH, FS_ERROR]

---

### core.analyzeGcode

**Description:** Analyzes G-code file and returns metrics.

- **Input:** `{ path: string }`
- **Output:** `object`
- **Errors:** ToolError[INVALID_PATH, FS_ERROR, PARSE_ERROR]

---
### core.analyzeFile

> [MIGRATION] Moved from mcp-bridge analyze command.

Analyze a file using AI.

**Input:**
- `path` (string) — path to file.

**Output:**
- `path` — file path
- `length` — content length
- `analysis` — AI-generated analysis

**Errors:**
- INVALID_INPUT
- FILE_TOO_LARGE
- OPENAI_KEY_MISSING
- AI_ERROR

### etno.listDir

**Description:** Etno domain directory listing.

- **Input:** `{ path: string }`
- **Output:** `{ entries: string[] }`
- **Errors:** ToolError[INVALID_PATH, FS_ERROR]

---

### etno.readFile

**Description:** Reads Etno domain file.

- **Input:** `{ path: string }`
- **Output:** `{ content: string }`
- **Errors:** ToolError[INVALID_PATH, FS_ERROR]

---

### etno.summarizeFile

**Description:** Summarizes Etno domain file content.

- **Input:** `{ path: string }`
- **Output:** `{ summary: string }`
- **Errors:** ToolError[INVALID_PATH, FS_ERROR]

---

### etno.parseMaterial

**Description:** Parses CNC material description.

- **Input:** `{ path: string }`
- **Output:** `object`
- **Errors:** ToolError[INVALID_PATH, FS_ERROR, PARSE_ERROR]

---

### factura.readFile

**Description:** Reads Factura domain file.

- **Input:** `{ path: string }`
- **Output:** `{ content: string }`
- **Errors:** ToolError[INVALID_PATH, FS_ERROR]

---

## 🚨 Deprecations

_None._

---

## 📜 Invariants

- Tools must not perform unbounded filesystem access.
- All paths must respect allowed roots.
- All errors must be thrown as ToolError.
- No tool may depend on bridge or agent logic.

---

_End of v1 tool surface._
