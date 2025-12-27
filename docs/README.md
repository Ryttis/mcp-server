# MCP Server — Kernel

The **MCP Server** is the kernel of the MCP system.  
It provides a bounded, stable, and testable execution environment for tools that
operate on local state, files, and project contexts.

This server is intentionally minimal:
it exposes business logic as tools, enforces safety limits, and normalizes errors.
All UI, transport, memory, and AI layers live outside this kernel.

---

## 🎯 Purpose

The MCP Server exists to:

- Expose a frozen set of **tools** as a stable public surface.
- Execute tool logic in a **safe and bounded** environment.
- Separate **pure logic** from **IO and side effects**.
- Normalize all errors into a consistent contract.
- Act as the **single source of truth** for local capabilities.

It is not responsible for:
- UI or user interaction.
- Protocol design or evolution.
- Long-term memory or state persistence.
- Model inference or AI orchestration.
- External API integrations beyond tool IO needs.

---

## 🧠 Kernel Principles

The server follows strict kernel rules:

1. **Stability over features**  
   Tool surface is frozen and versioned.

2. **Logic is pure**  
   All business logic is side-effect free.

3. **IO is a boundary**  
   Filesystem, env, network, and state live only in IO layers.

4. **Errors are normalized**  
   All failures become `ToolError` with stable codes.

5. **Resources are bounded**  
   File size, traversal depth, and execution time are limited.

6. **No hidden behavior**  
   Everything public is documented.

---

## 🧩 Architecture Overview

High-level flow:


Layers:

- **RPC layer**  
  Receives requests and enforces timeouts.

- **Tool orchestrator**  
  Thin wrapper that binds logic + IO.

- **Logic layer**  
  Pure functions. Validation and shaping only.

- **IO layer**  
  Filesystem, env, network, state, side effects.

- **State**  
  Central MCP state (lastContext, snapshots, tools).

---

## 🛡️ Safety & Guards

The kernel enforces:

- Max file size for reads.
- Max directory depth and entries.
- Root path confinement for project tools.
- Tool execution timeouts.
- Controlled mutation of MCP state.

Limits are defined in:


---

## 🧪 Testing

The kernel includes smoke tests to verify:

- Tool loading and execution.
- Error normalization.
- Real filesystem IO.
- Wiring between layers.

Run tests with:

```bash
node --test
