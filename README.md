# SUMM Console

A web-based intelligent assistant interface for interacting with the SUMM (Smart Unified Management Model) AI system.

## Features

- **TODO Management**: Create, track, and organize tasks with file attachments
- **SUMM Terminal**: Interactive terminal interface with xterm.js
- **Session Management**: View and connect to multiple SUMM sessions
- **Draft Editor**: Auto-saving notes editor
- **Progress Tracking**: Daily progress log with archiving
- **Token Monitoring**: API usage visualization
- **Work Plan Display**: Markdown-based plan viewer

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, xterm.js
- **Backend**: Fastify, WebSocket, Node.js
- **Storage**: File system (JSON/Markdown)
- **External**: SUMM CLI, Claude Daemon

## Prerequisites

- Node.js 18+
- tmux 3.0+
- SUMM CLI (`summ` command in PATH)
- Claude Daemon running (`summ-daemon`)

## Installation

1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd SUMM-Console
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment:
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

4. Build the application:
   ```bash
   npm run build
   ```

## Usage

### Development

```bash
npm run dev
```

This starts both frontend (http://localhost:5173) and backend (http://localhost:3000).

### Production

```bash
npm start
```

Or use the provided scripts:
```bash
./scripts/start.sh
./scripts/stop.sh
./scripts/health-check.sh
```

### Systemd Service

See [docs/deployment/systemd.md](docs/deployment/systemd.md) for detailed instructions.

## Configuration

Environment variables (see `.env.example`):

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 | Server port |
| `SUMM_DIR` | ./SUMM | Data directory |
| `SUMM_WORK_DIR` | cwd | Workspace directory |
| `ANTHROPIC_API_KEY` | - | For token usage (optional) |

## Project Structure

```
SUMM-Console/
├── src/
│   ├── client/          # Frontend React app
│   ├── server/          # Backend Fastify server
│   └── shared/          # Shared TypeScript types
├── SUMM/                # Runtime data directory
├── docs/                # Documentation
├── scripts/             # Deployment scripts
└── dist/                # Build output
```

## Development

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development servers |
| `npm run dev:client` | Start frontend only |
| `npm run dev:server` | Start backend only |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run TypeScript check |

### API Endpoints

See [docs/plans/backend-codex-design.md](docs/plans/backend-codex-design.md) for full API documentation.

## Keyboard Shortcuts

- `Ctrl+N`: Create new TODO
- `Escape`: Close modal

## Troubleshooting

### Daemon not running (E007)

Start the SUMM daemon:
```bash
summ-daemon start
```

### tmux unavailable (E009)

Install tmux 3.0+:
```bash
# Ubuntu/Debian
sudo apt-get install tmux

# macOS
brew install tmux
```

## License

MIT

## Contributing

See [docs/plans/](docs/plans/) for implementation plans.
