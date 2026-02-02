# Phase 8: Deployment Preparation - Detailed Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Prepare the application for production deployment with build configuration, documentation, and deployment scripts.

**Architecture:** Production build with Vite, systemd service configuration, health checks, documentation.

**Tech Stack:** Vite build, Node.js, systemd, shell scripts

---

## Task 1: Production Build Configuration

**Files:**
- Modify: `vite.config.ts`
- Modify: `package.json`

**Step 1: Update Vite config for production**

Edit: `vite.config.ts`

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production'

  return {
    plugins: [react()],
    root: './src/client',
    publicDir: '../../public',
    build: {
      outDir: '../../dist/client',
      emptyOutDir: true,
      sourcemap: !isProduction,
      minify: 'terser',
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor': ['react', 'react-dom'],
            'terminal': ['xterm'],
            'markdown': ['react-markdown']
          }
        }
      }
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true
        },
        '/ws': {
          target: 'ws://localhost:3000',
          ws: true
        }
      }
    },
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '0.1.0')
    }
  }
})
```

**Step 2: Add production scripts to package.json**

Edit: `package.json`

```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:server\" \"npm run dev:client\"",
    "dev:client": "vite",
    "dev:server": "tsx watch src/server/index.ts",
    "build": "npm run build:client && npm run build:server",
    "build:client": "vite build",
    "build:server": "tsc -p tsconfig.node.json",
    "start": "NODE_ENV=production node dist/server/index.js",
    "start:dev": "tsx src/server/index.ts",
    "preview": "vite preview",
    "lint": "tsc --noEmit",
    "test": "npm run lint"
  }
}
```

**Step 3: Test production build**

Run:
```bash
npm run build
```

Expected: Clean build in `dist/` directory

**Step 4: Commit**

```bash
git add vite.config.ts package.json
git commit -m "chore: update build configuration for production

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 2: Server Production Updates

**Files:**
- Modify: `src/server/index.ts`

**Step 1: Add production optimizations**

Edit: `src/server/index.ts`

Add compression plugin and security headers:

```typescript
import Fastify from 'fastify'
import cors from '@fastify/cors'
import multipart from '@fastify/multipart'
import { config } from './config.js'
import { ensureSummDir } from './storage.js'

const fastify = Fastify({
  logger: process.env.NODE_ENV !== 'production'
})

// Register CORS
await fastify.register(cors, {
  origin: process.env.CORS_ORIGIN || true
})

// Register multipart for file uploads
await fastify.register(multipart, {
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  }
})

// Security headers
fastify.addHook('onRequest', async (request, reply) => {
  reply.header('X-Content-Type-Options', 'nosniff')
  reply.header('X-Frame-Options', 'DENY')
  reply.header('X-XSS-Protection', '1; mode=block')
})

// Ensure SUMM directory exists
await ensureSummDir()

// Health check route
fastify.get('/api/health', async (request, reply) => {
  return { status: 'ok', message: 'SUMM Console Backend Ready', version: process.env.npm_package_version || '0.1.0' }
})

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  await fastify.register(import('@fastify/static'), {
    root: './dist/client',
    prefix: '/'
  })

  // SPA fallback - serve index.html for non-API routes
  fastify.setNotFoundHandler(async (request, reply) => {
    if (request.url.startsWith('/api') || request.url.startsWith('/ws')) {
      return reply.code(404).send({ success: false, error: 'Not found' })
    }
    return reply.sendFile('index.html')
  })
}

// ... rest of existing code
```

**Step 2: Commit**

```bash
git add src/server/index.ts
git commit -m "feat: add production server optimizations

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 3: Deployment Scripts

**Files:**
- Create: `scripts/start.sh`
- Create: `scripts/stop.sh`
- Create: `scripts/health-check.sh`

**Step 1: Create start script**

Create: `scripts/start.sh`

```bash
#!/bin/bash
set -e

echo "Starting SUMM Console..."

# Load environment
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Ensure SUMM directory exists
mkdir -p "${SUMM_DIR:-./SUMM}"

# Start server
NODE_ENV=${NODE_ENV:-production} \
PORT=${PORT:-3000} \
SUMM_DIR="${SUMM_DIR:-./SUMM}" \
SUMM_WORK_DIR="${SUMM_WORK_DIR:-$PWD}" \
node dist/server/index.js
```

**Step 2: Create stop script**

Create: `scripts/stop.sh`

```bash
#!/bin/bash
echo "Stopping SUMM Console..."

# Find and kill process
PID=$(lsof -ti:3000) || true

if [ -n "$PID" ]; then
  echo "Killing process $PID"
  kill $PID
  echo "SUMM Console stopped"
else
  echo "SUMM Console not running"
fi
```

**Step 3: Create health check script**

Create: `scripts/health-check.sh`

```bash
#!/bin/bash
set -e

PORT=${PORT:-3000}

echo "Checking SUMM Console health..."

RESPONSE=$(curl -s "http://localhost:$PORT/api/health" || echo '{"status":"error"}')

if echo "$RESPONSE" | grep -q '"status":"ok"'; then
  echo "✓ SUMM Console is healthy"
  echo "$RESPONSE"
  exit 0
else
  echo "✗ SUMM Console health check failed"
  echo "$RESPONSE"
  exit 1
fi
```

**Step 4: Make scripts executable**

Run:
```bash
chmod +x scripts/start.sh scripts/stop.sh scripts/health-check.sh
```

**Step 5: Commit**

```bash
git add scripts/
git commit -m "chore: add deployment scripts

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 4: Systemd Service File

**Files:**
- Create: `summ-console.service`

**Step 1: Create systemd service file**

Create: `summ-console.service`

```ini
[Unit]
Description=SUMM Console
After=network.target

[Service]
Type=simple
User=%i
WorkingDirectory=/opt/summ-console
Environment="NODE_ENV=production"
Environment="PORT=3000"
EnvironmentFile=/opt/summ-console/.env
ExecStart=/usr/bin/node dist/server/index.js
Restart=on-failure
RestartSec=10

# Security
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

**Step 2: Create installation instructions**

Create: `docs/deployment/systemd.md`

```markdown
# Systemd Service Installation

## User Service (Recommended)

1. Copy the service file:
   ```bash
   mkdir -p ~/.config/systemd/user/
   cp summ-console.service ~/.config/systemd/user/
   ```

2. Reload systemd:
   ```bash
   systemctl --user daemon-reload
   ```

3. Enable and start:
   ```bash
   systemctl --user enable summ-console
   systemctl --user start summ-console
   ```

4. Check status:
   ```bash
   systemctl --user status summ-console
   ```

## System-wide Service

1. Copy service file to system directory:
   ```bash
   sudo cp summ-console.service /etc/systemd/system/
   ```

2. Create summ-console user:
   ```bash
   sudo useradd -r -s /bin/false summ-console
   ```

3. Set permissions:
   ```bash
   sudo chown -R summ-console:summ-console /opt/summ-console
   ```

4. Enable and start:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable summ-console
   sudo systemctl start summ-console
   ```
```

**Step 3: Commit**

```bash
git add summ-console.service docs/deployment/systemd.md
git commit -m "docs: add systemd service configuration

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 5: README Documentation

**Files:**
- Create: `README.md`

**Step 1: Create comprehensive README**

Create: `README.md`

```markdown
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
```

**Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add comprehensive README

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 6: Deployment Documentation

**Files:**
- Create: `docs/deployment/production.md`

**Step 1: Create deployment guide**

Create: `docs/deployment/production.md`

```markdown
# Production Deployment Guide

## Pre-deployment Checklist

- [ ] Node.js 18+ installed
- [ ] tmux 3.0+ installed
- [ ] SUMM CLI available in PATH
- [ ] Claude Daemon installed and running
- [ ] Environment variables configured
- [ ] SUMM_DIR directory with proper permissions
- [ ] Firewall configured for PORT

## Deployment Steps

### 1. Build Application

```bash
npm run build
```

Verify output in `dist/` directory.

### 2. Prepare Production Directory

```bash
# Create installation directory
sudo mkdir -p /opt/summ-console

# Copy files
sudo cp -r dist/ /opt/summ-console/
sudo cp package.json /opt/summ-console/
sudo cp .env /opt/summ-console/  # Configure this first!

# Set permissions
sudo chown -R $USER:$USER /opt/summ-console
```

### 3. Configure Environment

Edit `/opt/summ-console/.env`:

```env
NODE_ENV=production
PORT=3000
SUMM_DIR=/opt/summ-data
SUMM_WORK_DIR=/path/to/workspace
ANTHROPIC_API_KEY=sk-xxx
```

### 4. Install Production Dependencies

```bash
cd /opt/summ-console
npm ci --production
```

### 5. Test Run

```bash
node dist/server/index.js
```

Check http://localhost:3000/api/health

### 6. Configure systemd

See [systemd.md](systemd.md)

### 7. Start Service

```bash
systemctl --user start summ-console
systemctl --user status summ-console
```

## Monitoring

### Health Check

```bash
curl http://localhost:3000/api/health
```

Or use the script:
```bash
./scripts/health-check.sh
```

### Logs

```bash
journalctl --user -u summ-console -f
```

## Updating

1. Stop service:
   ```bash
   systemctl --user stop summ-console
   ```

2. Build and deploy new version

3. Restart service:
   ```bash
   systemctl --user start summ-console
   ```

## Security Considerations

- Use environment variables for secrets
- Restrict CORS origin in production
- Use reverse proxy (nginx) for SSL
- Set up firewall rules
- Regular security updates

## Reverse Proxy Configuration (nginx)

```nginx
server {
    listen 80;
    server_name summ-console.example.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /ws {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}
```
```

**Step 2: Commit**

```bash
git add docs/deployment/production.md
git commit -m "docs: add production deployment guide

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 7: Final Pre-deployment Verification

**Files:** None (verification)

**Step 1: Production build test**

Run:
```bash
npm run build
NODE_ENV=production npm start
```

Expected: Server starts on port 3000

**Step 2: Health check verification**

Run:
```bash
curl http://localhost:3000/api/health
```

Expected: `{"status":"ok","message":"SUMM Console Backend Ready","version":"0.1.0"}`

**Step 3: Verify static file serving**

Open http://localhost:3000 in browser

Expected: Application loads correctly

**Step 4: Final commit**

```bash
git add -A
git commit -m "chore: Phase 8 complete - deployment preparation finished

Production build configuration complete
Deployment scripts added
Systemd service configured
Documentation complete
Ready for production deployment

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"

# Create version tag
git tag -a v0.1.0 -m "Release v0.1.0 - SUMM Console"
```

---

## Phase 8 Completion Criteria

- [x] Production build works correctly
- [x] Server serves static files in production
- [x] Deployment scripts functional
- [x] Systemd service configured
- [x] README documentation complete
- [x] Deployment guide written
- [x] Health check works
- [x] Version tagged

---

**Project Status:** Implementation complete, ready for deployment!
