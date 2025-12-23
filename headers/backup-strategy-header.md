# 🧩 MCP Backup Storage Strategy — Header (Concept Log v1)

**Date:** 2025-11-13  
**Author:** Rytis / MCP Development Notes  
**Scope:** Agent & Tool Improvement Pipeline  
**Status:** 💡 Concept (not yet implemented)

---

## 🧠 Context
The current MCP Agent writes `.bak` files directly beside the source files.  
While functional, this clutters project directories and lacks version history.

---

## 🎯 Objective
Design a modular, Laravel-style backup store under the project root:

- All AI-modified files stored under `.mcp_backups/{timestamp}/...`
- Folder structure mirrors the original project tree
- Each backup isolated & timestamped
- Future options: diffing, compression, pruning

---

## 🗂️ Proposed Folder Structure

.mcp_backups/
├── 2025-11-13_12-30-00/
│ ├── tools/core/readFile.js
│ ├── tools/core/writeFile.js
│ └── tools/etno/parseMaterial.js
├── 2025-11-13_13-05-42/
│ ├── tools/core/cache.js
│ └── tools/core/listDir.js

Each Agent improvement run creates a timestamped subdirectory.

---

## 🧱 Planned Implementation (Phase 2)
| Step | Description |
|------|--------------|
| 1 | On Agent start → create timestamp `YYYY-MM-DD_HH-MM-SS` |
| 2 | Build `.mcp_backups/{timestamp}/{relative_path}` |
| 3 | Ensure folder exists with `fs.mkdir(..., { recursive: true })` |
| 4 | Write original file content to mirrored path |
| 5 | Continue with AI improvement pipeline |

---

## 🔮 Future Enhancements
- Add `.ai/backups.log` — chronological record of all sessions
- Implement `mcp restore <file>` command
- Optional cleanup or compression policy
- Optional checksum verification between improved & original files
