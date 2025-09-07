import fastify from 'fastify'
import routesPlugin from './routes'
import { options } from './common/logger'
import cors from '@fastify/cors'
import servicesPlugin from './plugins/services'

function build () {
  const server = fastify({
    logger: {
      ...options,
      transport:
        process.env.NODE_ENV === 'development'
          ? {
              target: 'pino-pretty'
            }
          : undefined,
      serializers: {
        req (request) {
          return {
            method: request.method,
            url: request.url,
            headers: { ...request.headers },
            hostname: request.hostname,
            remoteAddress: request.ip,
            remotePort: request.socket.remotePort
          }
        }
      }
    }
  })

  server.register(cors, {
    origin: ['http://localhost:3000']
  })

  server.register(servicesPlugin)

  server.register(routesPlugin)

  server.route({
    method: 'GET',
    url: '/ok',
    async handler (request, reply) {
      server.log.info({
        querystring: request.query,
        headers: request.headers
      })
      await reply.status(200).send('ok')
    }
  })

  return server
}

export default build
