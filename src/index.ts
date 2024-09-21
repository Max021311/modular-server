import fastify from 'fastify'
import routesPlugin from './routes'

const server = fastify()

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

server.listen({ port: 8080 }, (err, address) => {
  if (err) {
    server.log.error(err)
    process.exit(1)
  }
  console.log(server.printRoutes())
  server.log.info(`Server listening at ${address}`)
})
