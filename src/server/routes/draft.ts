import type { FastifyInstance } from 'fastify'
import { readDraft, writeDraft } from '../storage.js'

export async function draftRoutes(fastify: FastifyInstance) {
  // Get draft
  fastify.get('/api/draft', async () => {
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
