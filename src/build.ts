import fastify from 'fastify'
import routesPlugin from './routes'
import { options } from './common/logger'
import cors from '@fastify/cors'
import servicesPlugin from './plugins/services'
import fastifySwagger from '@fastify/swagger'
import scalarPlugin from '@scalar/fastify-api-reference'

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

  server
    .register(fastifySwagger, {
      openapi: {
        openapi: '3.0.0',
        info: {
          title: 'Modular server API',
          description: 'API documentation',
          version: '0.1.0'
        },
        servers: [{
          url: 'http://localhost:8080',
          description: 'Development server'
        }],
        tags: [
          { name: 'Users', description: 'User related end-points' },
          { name: 'Students', description: 'Student related end-points' }
        ]
      }
    })
    .register(scalarPlugin, {
      routePrefix: '/documentation'
    })
    .register(cors, {
      origin: ['http://localhost:3000']
    })
    .register(servicesPlugin)
    .register(routesPlugin)

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
