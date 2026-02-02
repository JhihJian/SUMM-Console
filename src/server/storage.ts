import { promises as fs } from 'fs'
import path from 'path'
import { config } from './config.js'
import { Todo, ProgressItem } from '../shared/types.js'

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
