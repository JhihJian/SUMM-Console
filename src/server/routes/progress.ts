import type { FastifyInstance } from 'fastify'
import { readProgress, archiveProgress, addProgressItem } from '../storage.js'

export async function progressRoutes(fastify: FastifyInstance) {
  // Get progress
  fastify.get('/api/progress', async () => {
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
  fastify.post('/api/progress/archive', async (_request, reply) => {
    try {
      await archiveProgress()
      return { success: true }
    } catch (err: any) {
      return reply.code(400).send({ success: false, error: err.message })
    }
  })
}
