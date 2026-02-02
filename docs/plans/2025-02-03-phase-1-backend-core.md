# Phase 1: Backend Core Framework - Detailed Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the Fastify server infrastructure with configuration management, file storage abstraction, and Claude Daemon integration.

**Architecture:** Fastify server with modular routes, file-based storage in SUMM directory, CLI-based daemon integration.

**Tech Stack:** Fastify 4.x, @fastify/cors, @fastify/multipart, ws, TypeScript, Node.js child_process

---

## Task 1: Configuration Management Module

**Files:**
- Create: `src/server/config.ts`

**Step 1: Write the configuration module**

Create: `src/server/config.ts`

```typescript
interface Config {
  port: number
  summDir: string
  summWorkDir: string
  anthropicApiKey?: string
}

function loadConfig(): Config {
  const port = Number(process.env.PORT) || 3000
  const summDir = process.env.SUMM_DIR || './SUMM'
  const summWorkDir = process.env.SUMM_WORK_DIR || process.cwd()
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY

  return {
    port,
    summDir,
    summWorkDir,
    anthropicApiKey
  }
}

export const config = loadConfig()
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit --skipLibCheck`

Expected: No errors

**Step 3: Commit**

```bash
git add src/server/config.ts
git commit -m "feat: add configuration management module

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 2: File System Storage Module - Directory Setup

**Files:**
- Create: `src/server/storage.ts`

**Step 1: Write directory initialization functions**

Create: `src/server/storage.ts`

```typescript
import { promises as fs } from 'fs'
import path from 'path'
import { config } from './config.js'

export async function ensureSummDir(): Promise<void> {
  const dirs = [
    config.summDir,
    path.join(config.summDir, 'todos'),
    path.join(config.summDir, 'archive', 'todos'),
    path.join(config.summDir, 'archive', 'progress'),
    path.join(config.summDir, 'sessions')
  ]

  for (const dir of dirs) {
    try {
      await fs.mkdir(dir, { recursive: true })
    } catch (err) {
      // Ignore if already exists
      if ((err as NodeJS.ErrnoException).code !== 'EEXIST') {
        throw err
      }
    }
  }
}

export function safePath(base: string, target: string): string {
  const resolved = path.resolve(base, target)
  if (!resolved.startsWith(path.resolve(base))) {
    throw new Error('Invalid path: traversal detected')
  }
  return resolved
}
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit --skipLibCheck`

Expected: No errors

**Step 3: Commit**

```bash
git add src/server/storage.ts
git commit -m "feat: add storage module with directory initialization

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 3: File System Storage Module - TODO Operations

**Files:**
- Modify: `src/server/storage.ts`

**Step 1: Add TODO read/write functions**

Edit: `src/server/storage.ts` (add after existing exports)

```typescript
import { Todo } from '../shared/types.js'

const TODOS_DIR = path.join(config.summDir, 'todos')

export async function readTodos(): Promise<Todo[]> {
  try {
    const entries = await fs.readdir(TODOS_DIR, { withFileTypes: true })
    const todos: Todo[] = []

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const metaPath = path.join(TODOS_DIR, entry.name, 'meta.json')
        try {
          const content = await fs.readFile(metaPath, 'utf-8')
          todos.push(JSON.parse(content))
        } catch {
          // Skip invalid entries
        }
      }
    }

    return todos.sort((a, b) => a.order - b.order)
  } catch {
    return []
  }
}

export async function readTodo(id: string): Promise<Todo | null> {
  const metaPath = safePath(TODOS_DIR, path.join(id, 'meta.json'))
  try {
    const content = await fs.readFile(metaPath, 'utf-8')
    return JSON.parse(content)
  } catch {
    return null
  }
}

export async function writeTodo(todo: Todo): Promise<void> {
  const todoDir = safePath(TODOS_DIR, todo.id)
  await fs.mkdir(todoDir, { recursive: true })

  const metaPath = path.join(todoDir, 'meta.json')
  await fs.writeFile(metaPath, JSON.stringify(todo, null, 2), 'utf-8')
}

export async function deleteTodo(id: string): Promise<void> {
  const todoDir = safePath(TODOS_DIR, id)
  await fs.rm(todoDir, { recursive: true, force: true })
}

export async function archiveTodo(id: string): Promise<void> {
  const todo = await readTodo(id)
  if (!todo) {
    throw new Error('E001: Resource not accessible')
  }

  const todoDir = safePath(TODOS_DIR, id)
  const archiveDir = safePath(path.join(config.summDir, 'archive', 'todos'), id)

  await fs.rename(todoDir, archiveDir)
}
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit --skipLibCheck`

Expected: No errors

**Step 3: Commit**

```bash
git add src/server/storage.ts
git commit -m "feat: add TODO storage operations

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 4: File System Storage Module - Draft & Progress Operations

**Files:**
- Modify: `src/server/storage.ts`

**Step 1: Add draft and progress operations**

Edit: `src/server/storage.ts` (add after TODO operations)

```typescript
import { ProgressItem } from '../shared/types.js'

// Draft operations
const DRAFT_PATH = path.join(config.summDir, 'draft.txt')

export async function readDraft(): Promise<string> {
  try {
    return await fs.readFile(DRAFT_PATH, 'utf-8')
  } catch {
    return ''
  }
}

export async function writeDraft(content: string): Promise<void> {
  await fs.writeFile(DRAFT_PATH, content, 'utf-8')
}

// Progress operations
const PROGRESS_PATH = path.join(config.summDir, 'progress.json')
const ARCHIVE_PROGRESS_DIR = path.join(config.summDir, 'archive', 'progress')

export async function readProgress(): Promise<ProgressItem[]> {
  try {
    const content = await fs.readFile(PROGRESS_PATH, 'utf-8')
    return JSON.parse(content)
  } catch {
    return []
  }
}

export async function addProgressItem(item: ProgressItem): Promise<void> {
  const items = await readProgress()
  items.push(item)
  await fs.writeFile(PROGRESS_PATH, JSON.stringify(items, null, 2), 'utf-8')
}

export async function archiveProgress(): Promise<void> {
  try {
    const items = await readProgress()
    if (items.length === 0) return

    const timestamp = new Date().toISOString().split('T')[0]
    const archivePath = path.join(ARCHIVE_PROGRESS_DIR, `${timestamp}.json`)

    await fs.mkdir(ARCHIVE_PROGRESS_DIR, { recursive: true })
    await fs.writeFile(archivePath, JSON.stringify(items, null, 2), 'utf-8')
    await fs.writeFile(PROGRESS_PATH, '[]', 'utf-8')
  } catch (err) {
    throw new Error('E001: Archive operation failed')
  }
}
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit --skipLibCheck`

Expected: No errors

**Step 3: Commit**

```bash
git add src/server/storage.ts
git commit -m "feat: add draft and progress storage operations

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 5: File System Storage Module - Plan Operation

**Files:**
- Modify: `src/server/storage.ts`

**Step 1: Add plan read operation**

Edit: `src/server/storage.ts` (add at end)

```typescript
const PLAN_PATH = path.join(config.summDir, 'plan.md')

export async function readPlan(): Promise<string> {
  try {
    return await fs.readFile(PLAN_PATH, 'utf-8')
  } catch {
    return '# Work Plan\n\nNo work plan configured yet.'
  }
}
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit --skipLibCheck`

Expected: No errors

**Step 3: Commit**

```bash
git add src/server/storage.ts
git commit -m "feat: add plan storage operation

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 6: Claude Daemon Integration Module - Basic Commands

**Files:**
- Create: `src/server/daemon.ts`

**Step 1: Write daemon command executor**

Create: `src/server/daemon.ts`

```typescript
import { spawn } from 'child_process'

interface DaemonResult {
  success: boolean
  data?: any
  error?: string
  code?: string
}

function execSummCommand(args: string[], timeout = 30000): Promise<DaemonResult> {
  return new Promise((resolve) => {
    const proc = spawn('summ', args)
    let stdout = ''
    let stderr = ''

    const timer = setTimeout(() => {
      proc.kill()
      resolve({ success: false, error: 'Command timeout', code: 'E005' })
    }, timeout)

    proc.stdout.on('data', (data) => {
      stdout += data.toString()
    })

    proc.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    proc.on('close', (code) => {
      clearTimeout(timer)
      if (code === 0) {
        try {
          const data = stdout.trim() ? JSON.parse(stdout) : undefined
          resolve({ success: true, data })
        } catch {
          resolve({ success: true, data: stdout.trim() })
        }
      } else {
        resolve({ success: false, error: stderr || 'Command failed', code: 'E008' })
      }
    })

    proc.on('error', (err) => {
      clearTimeout(timer)
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        resolve({ success: false, error: 'SUMM CLI not found', code: 'E007' })
      } else {
        resolve({ success: false, error: err.message, code: 'E007' })
      }
    })
  })
}

export { execSummCommand, DaemonResult }
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit --skipLibCheck`

Expected: No errors

**Step 3: Commit**

```bash
git add src/server/daemon.ts
git commit -m "feat: add daemon command executor

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 7: Claude Daemon Integration Module - Session Operations

**Files:**
- Modify: `src/server/daemon.ts`

**Step 1: Add session management functions**

Edit: `src/server/daemon.ts` (add after existing exports)

```typescript
import { Session } from '../shared/types.js'

export async function checkDaemonRunning(): Promise<boolean> {
  const result = await execSummCommand(['status'], 5000)
  return result.success
}

export async function listSessions(status?: 'running' | 'idle' | 'stopped'): Promise<Session[]> {
  const args = ['list']
  if (status) {
    args.push('--status', status)
  }

  const result = await execSummCommand(args)
  if (!result.success) {
    if (result.code === 'E007') {
      throw new Error('E007: Daemon not running')
    }
    return []
  }

  // Parse sessions from output
  // Expected format: JSON array or specific output format
  try {
    const sessions = Array.isArray(result.data) ? result.data : []
    return sessions
      .filter((s: any) => s.status !== 'suspended' && s.status !== 'paused')
      .slice(0, 20)
  } catch {
    return []
  }
}

export async function getSessionStatus(id: string): Promise<DaemonResult> {
  return execSummCommand(['status', id])
}

export async function startSession(cli: string, init: string, name?: string): Promise<DaemonResult> {
  const args = ['start', '--cli', cli, '--init', init]
  if (name) {
    args.push('--name', name)
  }
  return execSummCommand(args, 60000)
}

export async function stopSession(id: string): Promise<DaemonResult> {
  return execSummCommand(['stop', id])
}

export async function injectMessage(id: string, message: string): Promise<DaemonResult> {
  const result = await execSummCommand(['inject', id, message])
  if (!result.success) {
    return { ...result, code: 'E006' }
  }
  return result
}
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit --skipLibCheck`

Expected: No errors

**Step 3: Commit**

```bash
git add src/server/daemon.ts
git commit -m "feat: add session management functions to daemon module

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 8: Claude Daemon Integration Module - Attach for Terminal

**Files:**
- Modify: `src/server/daemon.ts`

**Step 1: Add attach function for terminal connection**

Edit: `src/server/daemon.ts` (add after injectMessage)

```typescript
import { ChildProcess } from 'child_process'

export function attachSession(id: string): ChildProcess {
  const proc = spawn('summ', ['attach', id], {
    stdio: ['pipe', 'pipe', 'pipe']
  })

  return proc
}

export function attachSummMain(): ChildProcess {
  // Check if SUMM main session exists, if not start it
  const proc = spawn('summ', ['attach', 'summ-main'], {
    stdio: ['pipe', 'pipe', 'pipe']
  })

  return proc
}
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit --skipLibCheck`

Expected: No errors

**Step 3: Commit**

```bash
git add src/server/daemon.ts
git commit -m "feat: add attach functions for terminal connections

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 9: Fastify Server - Update with Configuration

**Files:**
- Modify: `src/server/index.ts`

**Step 1: Update server with config and plugins**

Edit: `src/server/index.ts` (replace entire file)

```typescript
import Fastify from 'fastify'
import cors from '@fastify/cors'
import multipart from '@fastify/multipart'
import { config } from './config.js'
import { ensureSummDir } from './storage.js'

const fastify = Fastify({
  logger: true
})

// Register CORS
await fastify.register(cors, {
  origin: true
})

// Register multipart for file uploads
await fastify.register(multipart, {
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  }
})

// Ensure SUMM directory exists
await ensureSummDir()

// Health check route
fastify.get('/api/health', async (request, reply) => {
  return { status: 'ok', message: 'SUMM Console Backend Ready' }
})

// Global error handler
fastify.setErrorHandler((error, request, reply) => {
  fastify.log.error(error)

  const statusCode = (error as any).statusCode || 500
  reply.code(statusCode).send({
    success: false,
    error: error.message || 'Internal server error'
  })
})

// 404 handler
fastify.setNotFoundHandler((request, reply) => {
  reply.code(404).send({
    success: false,
    error: 'Not found'
  })
})

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: config.port, host: '0.0.0.0' })
    console.log(`Server listening on http://localhost:${config.port}`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

// Graceful shutdown
const shutdown = async () => {
  await fastify.close()
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

start()
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit --skipLibCheck`

Expected: No errors

**Step 3: Test server starts**

Run: `npm run dev:server`

Expected: "Server listening on http://localhost:3000"

**Step 4: Test health check**

Run (in another terminal): `curl http://localhost:3000/api/health`

Expected: `{"status":"ok","message":"SUMM Console Backend Ready"}`

**Step 5: Stop server and commit**

```bash
# Stop server with Ctrl+C
git add src/server/index.ts
git commit -m "feat: update server with config, plugins, and error handling

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 10: TODO Routes - CRUD Operations

**Files:**
- Create: `src/server/routes/todos.ts`

**Step 1: Create TODO routes file**

Create: `src/server/routes/todos.ts`

```typescript
import { FastifyInstance } from 'fastify'
import { readTodos, readTodo, writeTodo, deleteTodo, archiveTodo } from '../storage.js'

export async function todoRoutes(fastify: FastifyInstance) {
  // List all todos
  fastify.get('/api/todos', async (request, reply) => {
    const todos = await readTodos()
    return { success: true, data: todos }
  })

  // Get single todo
  fastify.get('/api/todos/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const todo = await readTodo(id)

    if (!todo) {
      return reply.code(404).send({ success: false, error: 'E001: Todo not found' })
    }

    return { success: true, data: todo }
  })

  // Create todo
  fastify.post('/api/todos', async (request, reply) => {
    const { title, progress = 0, statusDesc = '', state = 'pending' } = request.body as any

    if (!title) {
      return reply.code(400).send({ success: false, error: 'Title is required' })
    }

    const todos = await readTodos()
    const maxOrder = todos.length > 0 ? Math.max(...todos.map(t => t.order)) : -1

    const newTodo = {
      id: `todo_${Date.now()}`,
      title,
      progress,
      statusDesc,
      state,
      order: maxOrder + 1,
      files: [],
      createdAt: new Date().toISOString()
    }

    await writeTodo(newTodo)
    return reply.code(201).send({ success: true, data: newTodo })
  })

  // Update todo
  fastify.put('/api/todos/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const updates = request.body as any

    const existing = await readTodo(id)
    if (!existing) {
      return reply.code(404).send({ success: false, error: 'E001: Todo not found' })
    }

    const updated = { ...existing, ...updates }
    await writeTodo(updated)

    return { success: true, data: updated }
  })

  // Delete todo
  fastify.delete('/api/todos/:id', async (request, reply) => {
    const { id } = request.params as { id: string }

    const existing = await readTodo(id)
    if (!existing) {
      return reply.code(404).send({ success: false, error: 'E001: Todo not found' })
    }

    await deleteTodo(id)
    return { success: true }
  })

  // Archive todo
  fastify.post('/api/todos/:id/archive', async (request, reply) => {
    const { id } = request.params as { id: string }

    try {
      await archiveTodo(id)
      return { success: true }
    } catch (err: any) {
      return reply.code(400).send({ success: false, error: err.message })
    }
  })
}
```

**Step 2: Register routes in server**

Edit: `src/server/index.ts` (add after imports)

```typescript
import { todoRoutes } from './routes/todos.js'

// Register routes (after plugins, before start)
await fastify.register(todoRoutes)
```

**Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit --skipLibCheck`

Expected: No errors

**Step 4: Commit**

```bash
git add src/server/routes/todos.ts src/server/index.ts
git commit -m "feat: add TODO CRUD routes

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 11: TODO Routes - File Upload

**Files:**
- Modify: `src/server/routes/todos.ts`

**Step 1: Add file management routes**

Edit: `src/server/routes/todos.ts` (add at end of todoRoutes function)

```typescript
import path from 'path'
import { config } from '../config.js'
import { safePath } from '../storage.js'
import { randomUUID } from 'crypto'

// Get todo files
fastify.get('/api/todos/:id/files', async (request, reply) => {
  const { id } = request.params as { id: string }
  const todo = await readTodo(id)

  if (!todo) {
    return reply.code(404).send({ success: false, error: 'E001: Todo not found' })
  }

  return { success: true, data: todo.files }
})

// Upload file to todo
fastify.post('/api/todos/:id/files', async (request, reply) => {
  const { id } = request.params as { id: string }
  const todo = await readTodo(id)

  if (!todo) {
    return reply.code(404).send({ success: false, error: 'E001: Todo not found' })
  }

  const data = await request.file()
  if (!data) {
    return reply.code(400).send({ success: false, error: 'No file uploaded' })
  }

  const fileId = randomUUID()
  const fileExt = path.extname(data.filename)
  const fileName = `${fileId}${fileExt}`
  const todoDir = safePath(path.join(config.summDir, 'todos'), id)
  const filesDir = path.join(todoDir, 'files')

  // Ensure files directory exists
  await import('fs').then(fs => fs.promises.mkdir(filesDir, { recursive: true }))

  const filePath = path.join(filesDir, fileName)
  const buffer = await data.toBuffer()

  await import('fs').then(fs => fs.promises.writeFile(filePath, buffer))

  const newFile = {
    id: fileId,
    name: data.filename,
    path: filePath,
    size: buffer.length,
    uploadedAt: new Date().toISOString()
  }

  todo.files.push(newFile)
  await writeTodo(todo)

  return { success: true, data: newFile }
})

// Delete file from todo
fastify.delete('/api/todos/:id/files/:fileId', async (request, reply) => {
  const { id, fileId } = request.params as { id: string; fileId: string }
  const todo = await readTodo(id)

  if (!todo) {
    return reply.code(404).send({ success: false, error: 'E001: Todo not found' })
  }

  const fileIndex = todo.files.findIndex(f => f.id === fileId)
  if (fileIndex === -1) {
    return reply.code(404).send({ success: false, error: 'File not found' })
  }

  const file = todo.files[fileIndex]

  // Delete from filesystem
  try {
    await import('fs').then(fs => fs.promises.unlink(file.path))
  } catch {
    // Ignore if file doesn't exist
  }

  todo.files.splice(fileIndex, 1)
  await writeTodo(todo)

  return { success: true }
})
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit --skipLibCheck`

Expected: No errors

**Step 3: Commit**

```bash
git add src/server/routes/todos.ts
git commit -m "feat: add TODO file upload and delete routes

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 12: Draft Routes

**Files:**
- Create: `src/server/routes/draft.ts`

**Step 1: Create draft routes**

Create: `src/server/routes/draft.ts`

```typescript
import { FastifyInstance } from 'fastify'
import { readDraft, writeDraft } from '../storage.js'

export async function draftRoutes(fastify: FastifyInstance) {
  // Get draft
  fastify.get('/api/draft', async (request, reply) => {
    const content = await readDraft()
    return {
      success: true,
      data: { content, updatedAt: new Date().toISOString() }
    }
  })

  // Save draft
  fastify.put('/api/draft', async (request, reply) => {
    const { content } = request.body as { content: string }

    if (typeof content !== 'string') {
      return reply.code(400).send({ success: false, error: 'Content must be a string' })
    }

    await writeDraft(content)
    return {
      success: true,
      data: { content, updatedAt: new Date().toISOString() }
    }
  })
}
```

**Step 2: Register in server**

Edit: `src/server/index.ts` (add after todoRoutes import)

```typescript
import { draftRoutes } from './routes/draft.js'

// In start function, add:
await fastify.register(draftRoutes)
```

**Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit --skipLibCheck`

Expected: No errors

**Step 4: Commit**

```bash
git add src/server/routes/draft.ts src/server/index.ts
git commit -m "feat: add draft routes

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 13: Progress Routes

**Files:**
- Create: `src/server/routes/progress.ts`

**Step 1: Create progress routes**

Create: `src/server/routes/progress.ts`

```typescript
import { FastifyInstance } from 'fastify'
import { readProgress, archiveProgress, addProgressItem } from '../storage.js'

export async function progressRoutes(fastify: FastifyInstance) {
  // Get progress
  fastify.get('/api/progress', async (request, reply) => {
    const items = await readProgress()
    return { success: true, data: items }
  })

  // Add progress item
  fastify.post('/api/progress', async (request, reply) => {
    const { description, todoId } = request.body as any

    if (!description) {
      return reply.code(400).send({ success: false, error: 'Description is required' })
    }

    const item = {
      id: `progress_${Date.now()}`,
      description,
      completedAt: new Date().toISOString(),
      todoId
    }

    await addProgressItem(item)
    return reply.code(201).send({ success: true, data: item })
  })

  // Archive progress
  fastify.post('/api/progress/archive', async (request, reply) => {
    try {
      await archiveProgress()
      return { success: true }
    } catch (err: any) {
      return reply.code(400).send({ success: false, error: err.message })
    }
  })
}
```

**Step 2: Register in server**

Edit: `src/server/index.ts`

```typescript
import { progressRoutes } from './routes/progress.js'

await fastify.register(progressRoutes)
```

**Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit --skipLibCheck`

Expected: No errors

**Step 4: Commit**

```bash
git add src/server/routes/progress.ts src/server/index.ts
git commit -m "feat: add progress routes

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 14: Plan Routes

**Files:**
- Create: `src/server/routes/plan.ts`

**Step 1: Create plan routes**

Create: `src/server/routes/plan.ts`

```typescript
import { FastifyInstance } from 'fastify'
import { readPlan } from '../storage.js'

export async function planRoutes(fastify: FastifyInstance) {
  // Get plan
  fastify.get('/api/plan', async (request, reply) => {
    const content = await readPlan()
    return { success: true, data: { content } }
  })
}
```

**Step 2: Register in server**

Edit: `src/server/index.ts`

```typescript
import { planRoutes } from './routes/plan.js'

await fastify.register(planRoutes)
```

**Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit --skipLibCheck`

Expected: No errors

**Step 4: Commit**

```bash
git add src/server/routes/plan.ts src/server/index.ts
git commit -m "feat: add plan routes

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 15: Sessions Routes

**Files:**
- Create: `src/server/routes/sessions.ts`

**Step 1: Create sessions routes**

Create: `src/server/routes/sessions.ts`

```typescript
import { FastifyInstance } from 'fastify'
import { listSessions } from '../daemon.js'

export async function sessionsRoutes(fastify: FastifyInstance) {
  // List sessions
  fastify.get('/api/sessions', async (request, reply) => {
    const { status } = request.query as { status?: 'running' | 'idle' | 'stopped' }

    try {
      const sessions = await listSessions(status)
      return { success: true, data: sessions }
    } catch (err: any) {
      return reply.code(503).send({
        success: false,
        error: err.message || 'Failed to fetch sessions'
      })
    }
  })
}
```

**Step 2: Register in server**

Edit: `src/server/index.ts`

```typescript
import { sessionsRoutes } from './routes/sessions.js'

await fastify.register(sessionsRoutes)
```

**Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit --skipLibCheck`

Expected: No errors

**Step 4: Commit**

```bash
git add src/server/routes/sessions.ts src/server/index.ts
git commit -m "feat: add sessions routes

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 16: Token Usage Routes

**Files:**
- Create: `src/server/routes/token.ts`

**Step 1: Create token routes**

Create: `src/server/routes/token.ts`

```typescript
import { FastifyInstance } from 'fastify'
import path from 'path'
import { config } from '../config.js'

export async function tokenRoutes(fastify: FastifyInstance) {
  // Get token usage
  fastify.get('/api/token-usage', async (request, reply) => {
    // Try reading from cache file first (preferred method)
    const cachePath = path.join(config.summDir, 'token-cache.json')

    try {
      const fs = await import('fs/promises')
      const content = await fs.readFile(cachePath, 'utf-8')
      const data = JSON.parse(content)

      return {
        success: true,
        data: {
          used: data.used || 0,
          limit: data.limit || 200000,
          percentage: Math.round((data.used / data.limit) * 100)
        }
      }
    } catch {
      // Return default values if cache not available
      return {
        success: true,
        data: {
          used: 0,
          limit: 200000,
          percentage: 0
        }
      }
    }
  })
}
```

**Step 2: Register in server**

Edit: `src/server/index.ts`

```typescript
import { tokenRoutes } from './routes/token.js'

await fastify.register(tokenRoutes)
```

**Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit --skipLibCheck`

Expected: No errors

**Step 4: Commit**

```bash
git add src/server/routes/token.ts src/server/index.ts
git commit -m "feat: add token usage routes

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 17: WebSocket Terminal Proxy - Basic Setup

**Files:**
- Create: `src/server/ws/terminal.ts`

**Step 1: Create WebSocket handler**

Create: `src/server/ws/terminal.ts`

```typescript
import { WebSocket } from 'ws'
import { attachSession, attachSummMain } from '../daemon.js'

interface WSMessage {
  type: 'input' | 'resize'
  data?: string
  cols?: number
  rows?: number
}

interface TerminalConnection {
  ws: WebSocket
  process: any
  sessionId?: string
}

const connections = new Set<TerminalConnection>()

export function handleTerminalConnection(ws: WebSocket, sessionId?: string) {
  let proc: any

  try {
    // Attach to SUMM or specific session
    proc = sessionId ? attachSession(sessionId) : attachSummMain()

    const connection: TerminalConnection = { ws, process: proc, sessionId }
    connections.add(connection)

    // Send initial status
    ws.send(JSON.stringify({
      type: 'status',
      connected: true,
      needsDecision: false
    }))

    // Forward stdout to WebSocket
    proc.stdout.on('data', (data: Buffer) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'output',
          data: data.toString('utf-8')
        }))
      }
    })

    // Forward stderr to WebSocket
    proc.stderr.on('data', (data: Buffer) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'output',
          data: data.toString('utf-8')
        }))
      }
    })

    // Handle incoming messages
    ws.on('message', (message: string) => {
      try {
        const msg: WSMessage = JSON.parse(message.toString())

        if (msg.type === 'input' && msg.data) {
          proc.stdin.write(msg.data + '\n')
        } else if (msg.type === 'resize' && msg.cols && msg.rows) {
          // Resize handling (for tmux integration)
          // This is handled at the process level
        }
      } catch (err) {
        console.error('Failed to parse WS message:', err)
      }
    })

    // Handle close - don't terminate the process
    ws.on('close', () => {
      connections.delete(connection)
      // Don't kill the process - daemon manages lifecycle
    })

    // Handle process exit
    proc.on('close', () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'status',
          connected: false,
          needsDecision: false
        }))
      }
    })

  } catch (err) {
    ws.send(JSON.stringify({
      type: 'status',
      connected: false,
      needsDecision: false,
      error: 'Failed to connect to terminal'
    }))
    ws.close()
  }
}

export function closeAllConnections() {
  for (const conn of connections) {
    conn.ws.close()
  }
  connections.clear()
}
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit --skipLibCheck`

Expected: No errors

**Step 3: Commit**

```bash
git add src/server/ws/terminal.ts
git commit -m "feat: add WebSocket terminal handler

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 18: WebSocket Server Integration

**Files:**
- Modify: `src/server/index.ts`

**Step 1: Add WebSocket server**

Edit: `src/server/index.ts` (add after imports and before server setup)

```typescript
import { createServer } from 'http'
import { WebSocketServer } from 'ws'
import { handleTerminalConnection, closeAllConnections } from './ws/terminal.js'

// After fastify is defined, create HTTP server for WebSocket
const server = createServer()

// Register WebSocket server
const wss = new WebSocketServer({ server, path: '/ws' })

wss.on('connection', (ws, req) => {
  const url = req.url || ''

  if (url.startsWith('/ws/terminal/summ')) {
    handleTerminalConnection(ws)
  } else if (url.startsWith('/ws/terminal/session/')) {
    const sessionId = url.split('/').pop()
    if (sessionId) {
      handleTerminalConnection(ws, sessionId)
    }
  } else {
    ws.close()
  }
})

// Update fastify to use the same server
await fastify.register(async () => {
  fastify.server.removeListener('request', fastify.server.listener)
  server.on('request', fastify.server.listener)
})
```

**Step 2: Update graceful shutdown**

Edit: `src/server/index.ts` (modify shutdown function)

```typescript
const shutdown = async () => {
  closeAllConnections()
  wss.close()
  await fastify.close()
  process.exit(0)
}
```

**Step 3: Update start function**

Edit: `src/server/index.ts` (modify start function)

```typescript
const start = async () => {
  try {
    // Attach fastify to our HTTP server
    await fastify.ready()
    server.on('request', fastify.server.listener)

    server.listen(config.port, '0.0.0.0', () => {
      console.log(`Server listening on http://localhost:${config.port}`)
      console.log(`WebSocket server running on ws://localhost:${config.port}/ws`)
    })
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}
```

**Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit --skipLibCheck`

Expected: No errors

**Step 5: Test server starts**

Run: `npm run dev:server`

Expected: Server starts on port 3000

**Step 6: Stop and commit**

```bash
git add src/server/index.ts
git commit -m "feat: integrate WebSocket server with Fastify

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 19: Final Verification

**Files:** None (verification)

**Step 1: Test all API endpoints**

Run: `npm run dev:server`

Test each endpoint:
```bash
curl http://localhost:3000/api/health
curl http://localhost:3000/api/todos
curl http://localhost:3000/api/draft
curl http://localhost:3000/api/progress
curl http://localhost:3000/api/plan
curl http://localhost:3000/api/sessions
curl http://localhost:3000/api/token-usage
```

Expected: All return `{"success":true,...}`

**Step 2: Test TODO creation**

Run:
```bash
curl -X POST http://localhost:3000/api/todos \
  -H "Content-Type: application/json" \
  -d '{"title":"Test TODO"}'
```

Expected: Returns created TODO with `success: true`

**Step 3: Final commit**

```bash
git add -A
git commit -m "chore: Phase 1 complete - backend core framework finished

All REST API routes implemented
WebSocket terminal proxy implemented
Storage layer complete
Daemon integration complete

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Phase 1 Completion Criteria

- [x] Configuration module reads environment variables
- [x] Storage module handles all file operations
- [x] Daemon module wraps SUMM CLI commands
- [x] All REST API routes implemented (todos, draft, progress, plan, sessions, token)
- [x] WebSocket terminal proxy handles SUMM and session connections
- [x] Server handles errors gracefully
- [x] All code compiles without TypeScript errors

---

**Next:** Phase 2 - Frontend Basic Framework
