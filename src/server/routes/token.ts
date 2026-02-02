import type { FastifyInstance } from 'fastify'
import path from 'path'
import { config } from '../config.js'

export async function tokenRoutes(fastify: FastifyInstance) {
  // Get token usage
  fastify.get('/api/token-usage', async () => {
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
