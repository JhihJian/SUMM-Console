import Fastify from 'fastify'
import cors from '@fastify/cors'
import multipart from '@fastify/multipart'
import { WebSocketServer } from 'ws'
import { config } from './config.js'
import { ensureSummDir } from './storage.js'
import { todoRoutes } from './routes/todos.js'
import { draftRoutes } from './routes/draft.js'
import { progressRoutes } from './routes/progress.js'
import { planRoutes } from './routes/plan.js'
import { sessionsRoutes } from './routes/sessions.js'
import { tokenRoutes } from './routes/token.js'
import { handleTerminalConnection, closeAllConnections } from './ws/terminal.js'

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

// Register routes
await fastify.register(todoRoutes)
await fastify.register(draftRoutes)
await fastify.register(progressRoutes)
await fastify.register(planRoutes)
await fastify.register(sessionsRoutes)
await fastify.register(tokenRoutes)

// Health check route
fastify.get('/api/health', async () => {
  return { status: 'ok', message: 'SUMM Console Backend Ready' }
})

// Global error handler
fastify.setErrorHandler((error, _request, reply) => {
  fastify.log.error(error)
  const statusCode = (error as any).statusCode || 500
  reply.code(statusCode).send({
    success: false,
    error: (error as Error).message || 'Internal server error'
  })
})

// 404 handler
fastify.setNotFoundHandler((_request, reply) => {
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

    // Set up WebSocket server after Fastify is listening
    const wss = new WebSocketServer({
      server: fastify.server,
      path: '/ws'
    })

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

    // Store wss for graceful shutdown
    ;(fastify as any).wss = wss
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

// Graceful shutdown
const shutdown = async () => {
  const wss = (fastify as any).wss
  if (wss) {
    closeAllConnections()
    wss.close()
  }
  await fastify.close()
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

start()
