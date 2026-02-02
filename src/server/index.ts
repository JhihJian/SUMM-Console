import Fastify from 'fastify'
import cors from '@fastify/cors'

const fastify = Fastify({
  logger: true
})

// Register CORS
await fastify.register(cors, {
  origin: true
})

// Health check route
fastify.get('/api/health', async (request, reply) => {
  return { status: 'ok', message: 'SUMM Console Backend Ready' }
})

// Start server
const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3000
    await fastify.listen({ port, host: '0.0.0.0' })
    console.log(`Server listening on http://localhost:${port}`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
