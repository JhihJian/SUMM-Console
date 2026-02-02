import type { FastifyInstance } from 'fastify'
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
