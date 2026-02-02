import type { FastifyInstance } from 'fastify'
import { readPlan } from '../storage.js'

export async function planRoutes(fastify: FastifyInstance) {
  // Get plan
  fastify.get('/api/plan', async () => {
    const content = await readPlan()
    return { success: true, data: { content } }
  })
}
