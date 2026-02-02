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
