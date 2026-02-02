import type { FastifyInstance } from 'fastify'
import { readTodos, readTodo, writeTodo, deleteTodo, archiveTodo } from '../storage.js'
import { randomUUID } from 'crypto'
import path from 'path'
import { config } from '../config.js'
import { safePath } from '../storage.js'

export async function todoRoutes(fastify: FastifyInstance) {
  // List all todos
  fastify.get('/api/todos', async () => {
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
}
