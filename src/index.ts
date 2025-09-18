import build from './build.js'
import scalarPlugin from '@scalar/fastify-api-reference'

const server = build()

server.log.info({ env: process.env.NODE_ENV })

server.register(scalarPlugin, {
  routePrefix: '/documentation'
})
  .listen(
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
