import fastify from 'fastify'
import routesPlugin from './routes'
import { options } from './common/logger'

const server = fastify({
  logger: options
})

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

server.register(routesPlugin)

server.listen(
  {
    port: parseInt(process.env.PORT ?? '8080', 10)
  },
  (err, address) => {
    if (err) {
      server.log.error(err)
      process.exit(1)
    }
    // eslint-disable-next-line no-console
    console.log(server.printRoutes())
    server.log.info(`Server listening at ${address}`)
  }
)
