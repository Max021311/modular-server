import build from './build.js'

const server = build()

server.log.info({ env: process.env.NODE_ENV })

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
