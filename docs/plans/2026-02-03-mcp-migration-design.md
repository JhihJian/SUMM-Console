# MCP Migration Design

**Date**: 2026-02-03
**Status**: Design Phase
**Goal**: Refactor SUMM Console architecture from shared file system to MCP (Model Context Protocol) interfaces for better separation of concerns

## Table of Contents

1. [Overview](#overview)
2. [Motivation](#motivation)
3. [High-Level Architecture](#high-level-architecture)
4. [MCP Interface Specification](#mcp-interface-specification)
5. [Data Storage Architecture](#data-storage-architecture)
6. [MCP Server Implementation](#mcp-server-implementation)
7. [Claude Code CLI Integration](#claude-code-cli-integration)
8. [Data Flow Examples](#data-flow-examples)
9. [Error Handling & Edge Cases](#error-handling--edge-cases)
10. [Migration Strategy](#migration-strategy)
11. [MCP Transport Selection](#mcp-transport-selection)
12. [Testing Strategy](#testing-strategy)

---

## Overview

This design document outlines the migration from a shared file system architecture to an MCP-based architecture where:
- **Console** acts as the MCP server, owning all shared data
- **SUMM Agent** (Claude Code CLI) acts as the MCP client, accessing data through well-defined interfaces
- All data exchange happens through MCP resources (read) and tools (write)
- No shared file system dependencies between Console and Agent

## Motivation

**Primary Driver**: Better separation of concerns

**Current Issues**:
- Console and Agent both read/write the same `SUMM/` directory
- Tight coupling through shared file conventions
- Difficult to test components independently
- No clear ownership of data
- Hard to evolve interfaces without breaking both sides

**Benefits of MCP Approach**:
- Console becomes single source of truth for shared data
- Clear interface boundaries (resources for read, tools for write)
- Agent and Console can run on different machines eventually
- Easier to test with mocked interfaces
- Better error handling and validation

---

## High-Level Architecture

### New System Structure

```
┌─────────────────────────────────────────────────────────┐
│                    SUMM Console                         │
│  ┌─────────────────────┐    ┌────────────────────────┐  │
│  │   Frontend (React)  │    │   Backend (Fastify)     │  │
│  │  - UI Components    │◄──►│  - REST API             │  │
│  │  - WebSocket Client │    │  - WebSocket Server     │  │
│  └─────────────────────┘    │  - MCP Server           │  │
│                             │  - Data Storage         │  │
│                             └────────────┬─────────────┘  │
└──────────────────────────────────────────┼────────────────┘
                                          │ MCP over SSE
                                          ▼
                              ┌────────────────────────┐
                              │   Claude Code CLI      │
                              │   (SUMM Agent)         │
                              │  - MCP Client          │
                              │  - Workspace Access    │
                              └────────────────────────┘
```

### Key Changes

- **Console Backend**: Adds MCP server module alongside existing REST API
- **Communication**: MCP protocol over SSE (Server-Sent Events) instead of shared files
- **Data Ownership**: Console owns all shared data, Agent has isolated workspace
- **Terminal**: WebSocket terminal connection remains unchanged

---

## MCP Interface Specification

### Resources (Read Access)

Console exposes the following MCP resources for Agent to read:

| Resource URI | Description |
|-------------|-------------|
| `summ://todos/list` | All active TODOs with metadata |
| `summ://todos/{id}` | Single TODO details including files |
| `summ://draft` | Current draft content |
| `summ://progress` | Today's progress items |
| `summ://plan` | Current work plan (Markdown) |
| `summ://sessions/list` | Active sessions status |

### Tools (Write Access)

Console exposes the following MCP tools for Agent to modify data:

| Tool Name | Parameters | Description |
|-----------|-----------|-------------|
| `create_todo` | `title`, `description`, `files?` | Create new TODO |
| `update_todo` | `id`, `progress?`, `status?`, `statusDesc?` | Update TODO progress/status |
| `archive_todo` | `id` | Move TODO to archive |
| `add_todo_file` | `id`, `file` | Attach file to TODO |
| `remove_todo_file` | `id`, `fileId` | Remove file from TODO |
| `update_draft` | `content` | Save draft content |
| `add_progress_item` | `description`, `timestamp?` | Add completed work item |
| `archive_progress` | - | Archive today's progress |
| `update_plan` | `content` | Update work plan content |

### Connection Model

- Agent connects to Console's MCP server at startup via SSE transport
- Console exposes MCP endpoint at `http://localhost:3000/mcp/sse`
- If connection drops, Console shows error state in UI
- Agent has no direct file system access to Console's data directory
- WebSocket terminal connection remains separate from MCP

### Data Ownership

- **Console owns**: `data/todos/`, `data/draft.txt`, `data/progress.json`, `data/plan.md`
- **Agent owns**: Its own workspace directory (`workspaces/{sessionId}/`)
- **No shared directory**: The `SUMM/` directory is eliminated

---

## Data Storage Architecture

### Console Data Directory

```
SUMM-Console/
├─ data/                    # Console's private data (was SUMM/)
│  ├─ todos/
│  │  └─ {todoId}/
│  │     ├─ meta.json
│  │     └─ files/
│  ├─ draft.txt
│  ├─ progress.json
│  ├─ plan.md
│  └─ archive/
│     ├─ todos/
│     └─ progress/
└─ workspaces/              # Agent workspaces (isolated)
   └─ {sessionId}/          # Each Agent session gets own dir
```

### Key Principles

- **SUMM/ → data/**: Console-owned, not shared
- **Agent workspaces**: Separate, managed by Console but Agent has full access
- **Console never reads**: Agent's workspace files
- **Agent never writes**: Console's data/ directory
- **All data exchange**: Through MCP interface only

### Environment Variables

```bash
CONSOLE_DATA_DIR=./data           # Console's data storage
CONSOLE_WORKSPACE_DIR=./workspaces # Agent workspace root
PORT=3000
ANTHROPIC_API_KEY=sk-xxx
```

### Storage Implementation

- Backend keeps existing file-based storage logic
- Storage layer (`src/server/storage.ts`) reads/writes to `data/`
- MCP server layer wraps storage operations
- REST API continues to work, reads from same storage as MCP
- Both REST and MCP share the same storage layer (no synchronization needed)

---

## MCP Server Implementation

### Technology Stack

- **SDK**: `@modelcontextprotocol/sdk` - Official MCP SDK for TypeScript
- **Transport**: SSE (Server-Sent Events) over HTTP
- **Integration**: New module in Console backend

### Backend Structure

```
src/server/
├─ index.ts              # Fastify entry, starts MCP server
├─ storage.ts            # File-based storage (existing)
├─ mcp/
│  ├─ server.ts          # MCP server initialization
│  ├─ resources.ts       # Resource handlers (read)
│  ├─ tools.ts           # Tool handlers (write)
│  └─ types.ts           # MCP-specific types
├─ routes/               # REST API (existing, uses storage)
└─ ws/                   # WebSocket terminal (existing)
```

### MCP Server Lifecycle

1. Console backend starts → Initialize MCP server
2. User opens Console UI → Backend ready to accept MCP connections
3. Claude Code CLI connects via MCP → Registers with Console
4. Agent calls MCP tools/resources → Console storage operations
5. UI polls REST API → Gets same data from storage
6. Agent exits → Console detects, shows status in UI
7. User can restart Agent → New MCP connection established

### Key Implementation Details

- MCP server runs in same process as Fastify
- One MCP connection per Agent instance
- Storage layer is shared between REST API and MCP handlers
- MCP tools validate inputs and return structured errors
- Resources support URI templates for dynamic paths (e.g., `summ://todos/{id}`)

---

## Claude Code CLI Integration

### Agent Configuration

Claude Code CLI needs to be configured to connect to Console's MCP server:

```json
{
  "mcpServers": {
    "summ-console": {
      "url": "http://localhost:3000/mcp/sse"
    }
  }
}
```

### Agent Operation Mapping

| Old (File-based) | New (MCP) |
|-----------------|-----------|
| Read `SUMM/todos/*/meta.json` | `client.readResource('summ://todos/list')` |
| Write `SUMM/progress.json` | `client.callTool('add_progress_item', {...})` |
| Read `SUMM/plan.md` | `client.readResource('summ://plan')` |
| Write `SUMM/draft.txt` | `client.callTool('update_draft', {...})` |
| Update TODO progress | `client.callTool('update_todo', {id, progress, statusDesc})` |

### Agent Workspace

- Agent receives workspace path as environment variable: `AGENT_WORKSPACE`
- Agent can freely read/write files in its workspace
- Agent uses workspace for session-specific data, code generation, etc.
- Console never reads Agent workspace (true isolation)

### Skills/Prompts Updates

- SUMM Agent skills need updates to use MCP client calls
- Remove all direct file I/O to Console data directory
- Add MCP client wrapper utilities for common operations
- Error handling for MCP connection failures

---

## Data Flow Examples

### Example 1: Agent Updates TODO Progress

1. Agent completes a task
2. Agent calls: `client.callTool('update_todo', { id: 'todo_001', progress: 75, statusDesc: 'Implemented API endpoints' })`
3. Console MCP server receives tool call
4. MCP tool handler validates input
5. Storage layer updates `data/todos/todo_001/meta.json`
6. MCP returns success response to Agent
7. Frontend polls REST API `/api/todos`
8. REST API reads from storage (same file)
9. UI updates TODO panel with new progress

### Example 2: Agent Reads Work Plan

1. Agent needs to check current work plan
2. Agent calls: `client.readResource('summ://plan')`
3. Console MCP server receives resource request
4. Resource handler reads `data/plan.md`
5. Returns content as MCP resource response
6. Agent processes plan content

### Example 3: User Creates TODO via UI

1. User fills TODO form in UI
2. Frontend calls REST API: `POST /api/todos`
3. Backend storage creates `data/todos/todo_002/meta.json`
4. REST API returns success
5. Frontend refreshes TODO list
6. Agent later reads: `client.readResource('summ://todos/list')`
7. Agent sees new TODO and can start working on it

**Key Insight**: REST API and MCP share the same storage layer, so updates from either path are immediately visible to the other. No synchronization needed.

---

## Error Handling & Edge Cases

### MCP Connection Failures

- **Agent startup fails**: Console shows error in UI, provides restart button
- **Connection drops mid-session**: Console detects, marks Agent as disconnected
- **Agent can't reconnect**: User manually restarts from UI

### Concurrent Access

- **REST API and MCP both write to storage**: Use file locking or atomic writes
- **Multiple Agent instances (future)**: Each gets own MCP connection, storage handles concurrency

### Data Validation

- MCP tools validate all inputs before storage operations
- Invalid tool calls return structured errors to Agent
- Agent handles errors gracefully, can retry or report to user

### Backward Compatibility

- Old file-based Agent won't work with new Console
- Migration is a breaking change, requires coordinated update
- Document version compatibility clearly

---

## Migration Strategy

### Phase 1: Preparation (No Breaking Changes)

- Add MCP SDK dependencies to Console backend
- Implement MCP server module alongside existing code
- MCP server reads/writes to existing `SUMM/` directory
- Test MCP interface with MCP Inspector tool
- REST API continues working as-is

### Phase 2: Console Data Migration

- Rename `SUMM/` → `data/` in Console
- Update `storage.ts` paths
- Update environment variables
- Deploy new Console version
- Verify REST API still works with new paths

### Phase 3: MCP Server Deployment & Claude Code Integration

- Start Console's MCP server (SSE transport)
- Configure Claude Code CLI to connect to Console's MCP server
  - Add MCP server config to Claude Code's settings
  - Test connection with `claude mcp list` or similar
- Verify Claude Code can call tools and read resources
- Update SUMM Agent prompts/skills to use MCP instead of file operations
- Test end-to-end: UI → Console → MCP → Claude Code Agent

### Phase 4: Cleanup

- Remove shared file assumptions
- Update documentation for MCP-based architecture
- Remove old file-watching/polling code if any
- Verify complete separation

### Rollback Plan

- Keep old file-based code in git history
- Document exact commit for rollback
- Test rollback procedure before Phase 3

### Timeline Considerations

- Phases 1-2 can be done independently (Console only)
- Phase 3 requires coordinated Agent update
- Phase 4 is cleanup, can be done gradually

---

## MCP Transport Selection

### Decision: SSE (Server-Sent Events) over HTTP

**Why SSE over stdio**:
- Claude Code CLI and Console are separate processes
- Can restart either independently
- Easier debugging (can inspect HTTP traffic)
- Supports remote deployment later
- Better fits the separation of concerns goal

### Configuration

Console exposes MCP server at startup:
```
http://localhost:3000/mcp/sse
```

Claude Code CLI configuration:
```json
{
  "mcpServers": {
    "summ-console": {
      "url": "http://localhost:3000/mcp/sse"
    }
  }
}
```

---

## Testing Strategy

### Unit Tests

- Test each MCP tool handler independently
- Mock storage layer
- Verify input validation
- Test error responses
- Example: `update_todo` with invalid ID returns proper error

### Integration Tests

- Use `@modelcontextprotocol/sdk` test client
- Test full request/response cycle
- Verify storage operations actually happen
- Test resource reads return correct data
- Test concurrent tool calls

### MCP Inspector Testing

- Use official MCP Inspector tool during development
- Manually test each resource and tool
- Verify response schemas match specification
- Test error cases interactively

### Claude Code CLI Testing

- Configure Claude Code to connect to Console MCP server
- Create test prompts that exercise MCP tools
  - Example: "Create a TODO called 'Test Task'"
- Verify Claude Code can read resources
  - Example: "What's in my current work plan?"
- Test error handling when Console is down

### End-to-End Testing

- Start Console backend
- Connect Claude Code CLI
- Perform operations via Claude Code
- Verify UI reflects changes (via REST API)
- Test bidirectional flow: UI → Storage ← MCP ← Claude Code

### Performance Testing

- Test MCP response times under load
- Verify SSE connection stability
- Test with large resources (big `plan.md` files)
- Monitor memory usage with long-running connections

---

## Summary

This design achieves the goal of **better separation of concerns** by:

1. **Clear ownership**: Console owns shared data, Agent owns its workspace
2. **Well-defined interface**: MCP resources (read) and tools (write)
3. **No shared files**: All communication through MCP protocol
4. **Independent processes**: Console and Agent can run separately
5. **Easier testing**: Components can be tested with mocked interfaces
6. **Future-proof**: Can support remote deployment and multiple agents

The migration is structured in phases to minimize risk and allow incremental testing.
