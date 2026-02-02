# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SUMM Console is a web-based intelligent assistant interface for interacting with the SUMM (Smart Unified Management Model) AI system. The project consists of:
- **Frontend**: React + Vite UI with a retro cyberpunk aesthetic
- **Backend**: Fastify-based REST API and WebSocket terminal proxy
- **External Integration**: Claude Daemon for AI agent session management

**Current State**: The project is in prototype phase. `summ-ui-v1.0.html` is a functional design mockup implemented as a single HTML file with inline CSS and JavaScript. The production implementation with React/Fastify is planned and documented in `docs/`.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────┐
│                    SUMM Console                         │
│  ┌─────────────────────┐    ┌────────────────────────┐  │
│  │      Frontend       │    │       Backend           │  │
│  │  - React UI         │◄──►│  - Fastify API          │  │
│  │  - xterm.js Terminal │    │  - WebSocket Proxy      │  │
│  │  - File Management   │    │  - Claude Daemon Interop │  │
│  └─────────────────────┘    └────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                                          │ command line
                                          ▼
                              ┌────────────────────────┐
                              │     Claude Daemon      │
                              │  - Process Management  │
                              │  - Session Management  │
                              └────────────────────────┘
```

### Planned Directory Structure

```
SUMM-Console/
├─ src/
│  ├─ client/              # Frontend (React + Vite)
│  │  ├─ components/       # UI components
│  │  ├─ hooks/           # Custom React hooks
│  │  ├─ api.ts           # REST API client
│  │  └─ main.tsx         # Entry point
│  ├─ server/             # Backend (Fastify)
│  │  ├─ routes/          # REST API routes
│  │  ├─ ws/              # WebSocket handlers
│  │  ├─ daemon.ts        # Claude Daemon integration
│  │  └─ index.ts         # Server entry point
│  └─ shared/             # Shared TypeScript types
├─ SUMM/                  # Runtime data directory
├─ docs/
│  ├─ desgin/             # Product requirements
│  └─ plans/              # Implementation plans
└─ summ-ui-v1.0.html     # Current prototype
```

### Data Storage (SUMM Directory)

All persistent data is stored as files in the `SUMM/` directory (configurable via `SUMM_DIR`):

```
SUMM/
├─ todos/
│  └─ {todoId}/
│     ├─ meta.json        # TODO metadata
│     └─ files/           # Attached files
├─ draft.txt              # Global draft content
├─ progress.json          # Daily progress log
├─ plan.md                # Work plan (Markdown)
├─ sessions/              # Session work dirs (managed by daemon)
└─ archive/
   ├─ todos/
   └─ progress/
```

## Key Technologies

- **Frontend**: React 18, Vite, xterm.js, @dnd-kit, react-markdown, TypeScript
- **Backend**: Fastify, ws, @fastify/multipart, @fastify/cors
- **External**: Claude Daemon (requires `summ` CLI in PATH, tmux 3.0+)

## UI Layout

Fixed 3-column grid with 6 panels:

| Left Column | Center Column | Right Column |
|-------------|---------------|--------------|
| TODO Panel (top) | SUMM Chat Panel (top) | Sessions Panel (top) |
| Draft Panel (bottom) | Display Panel (bottom, spans 2 rows) | Progress Panel (middle) |
| - | - | Token Panel (bottom) |

**Visual Style**: Dark background (`#0a0a12`) with neon accent colors (cyan `#00fff9`, magenta `#ff00ff`, amber `#ffb800`, green `#00ff88`). Retro tech/pixel aesthetic with VT323 font for headers.

## REST API Endpoints (Planned)

### TODO Management
- `GET /api/todos` - List all TODOs
- `POST /api/todos` - Create TODO
- `GET /api/todos/:id` - Get single TODO
- `PUT /api/todos/:id` - Update TODO
- `DELETE /api/todos/:id` - Delete TODO
- `POST /api/todos/:id/archive` - Archive TODO
- `GET /api/todos/:id/files` - List attached files
- `POST /api/todos/:id/files` - Upload file (multipart, max 50MB)
- `DELETE /api/todos/:id/files/:fileId` - Delete file

### Other Resources
- `GET /api/draft` - Get draft content
- `PUT /api/draft` - Save draft content
- `GET /api/progress` - Get daily progress
- `POST /api/progress/archive` - Archive progress
- `GET /api/plan` - Get work plan (Markdown)
- `GET /api/sessions` - List sessions (running/idle only, max ~20)
- `GET /api/token-usage` - Get token usage stats

## WebSocket Endpoints (Planned)

- `/ws/terminal/summ` - SUMM main agent terminal
- `/ws/terminal/session/:id` - Specific session terminal

**Message Format (Client → Server):**
```json
{ "type": "input", "data": "..." }
{ "type": "resize", "cols": 120, "rows": 30 }
```

**Message Format (Server → Client):**
```json
{ "type": "output", "data": "..." }
{ "type": "status", "connected": true, "needsDecision": false }
```

## Polling Strategy

Frontend polls backend at different intervals:
- TODO list: 5 seconds
- Sessions: 3 seconds
- Progress: 10 seconds
- Token usage: 60 seconds

## Claude Daemon Integration

The backend interfaces with Claude Daemon via the `summ` CLI:
- `summ start --cli <command> --init <path|zip> [--name <name>]` - Start session
- `summ list [--status <running|idle|stopped>]` - List sessions
- `summ status <session_id>` - Query session status
- `summ attach <session_id>` - Connect to session (for terminal proxy)
- `summ inject <session_id> <message>` - Send message to session
- `summ stop <session_id>` - Stop session

**Important**: The daemon must be running before the Console backend starts. The backend should check daemon status and return error code E007 if unavailable.

## Environment Variables

```
SUMM_DIR=./SUMM                # Data directory
SUMM_WORK_DIR=/path/to/workspace
ANTHROPIC_API_KEY=sk-xxx       # For token usage API (optional)
PORT=3000                      # Server port
```

## Error Codes

- `E001` - Resource not accessible
- `E002` - Session not found
- `E003` - Session stopped
- `E004` - Archive extraction failed
- `E005` - Process start failed
- `E006` - Message injection failed
- `E007` - Daemon not running
- `E008` - Invalid CLI command
- `E009` - tmux unavailable

## Development Workflow

When implementing features:
1. Read `docs/desgin/SUMM-Console-PRD-v1.0.md` for product requirements
2. Read `docs/plans/backend-codex-design.md` or `frontend-codex-design.md` for implementation details
3. File operations should use `path.join()` to prevent path traversal
4. All file operations must be wrapped in `try/catch`
5. WebSocket connections should NOT terminate processes on close (daemon manages lifecycle)
6. Use React.memo for panel components to optimize re-renders

## Documentation Reference

- `docs/desgin/SUMM-Console-PRD-v1.0.md` - Complete product requirements with UI/UX specifications
- `docs/plans/backend-codex-design.md` - Backend implementation details (Fastify, API, WebSocket)
- `docs/plans/frontend-codex-design.md` - Frontend implementation details (React, components, hooks)
