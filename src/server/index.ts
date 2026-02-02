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
import { readFileSync } from 'fs'
import { join } from 'path'

const isProduction = process.env.NODE_ENV === 'production'

const fastify = Fastify({
  logger: !isProduction
})

// Register CORS
await fastify.register(cors, {
  origin: process.env.CORS_ORIGIN || true
})

// Register multipart for file uploads
await fastify.register(multipart, {
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  }
})

// Security headers
fastify.addHook('onRequest', async (_request, reply) => {
  reply.header('X-Content-Type-Options', 'nosniff')
  reply.header('X-Frame-Options', 'DENY')
  reply.header('X-XSS-Protection', '1; mode=block')
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
  return {
    status: 'ok',
    message: 'SUMM Console Backend Ready',
    version: process.env.npm_package_version || '0.1.0'
  }
})

// Serve static files in production
if (isProduction) {
  // Import @fastify/static dynamically for production
  const staticModule = await import('@fastify/static')
  const fastifyStatic = staticModule.default

  await fastify.register(fastifyStatic, {
    root: join(process.cwd(), 'dist/client'),
    prefix: '/'
  })

  // SPA fallback - serve index.html for non-API routes
  fastify.setNotFoundHandler(async (_request, reply) => {
    const indexPath = join(process.cwd(), 'dist/client', 'index.html')
    const indexContent = readFileSync(indexPath, 'utf-8')
    reply.type('text/html').send(indexContent)
  })
}

// Global error handler
fastify.setErrorHandler((error, _request, reply) => {
  if (!isProduction) {
    fastify.log.error(error)
  }
  const statusCode = (error as any).statusCode || 500
  reply.code(statusCode).send({
    success: false,
    error: (error as Error).message || 'Internal server error'
  })
})

// 404 handler for API routes
fastify.setNotFoundHandler((_request, reply) => {
  if (_request.url?.startsWith('/api') || _request.url?.startsWith('/ws')) {
    reply.code(404).send({
      success: false,
      error: 'Not found'
    })
  }
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
