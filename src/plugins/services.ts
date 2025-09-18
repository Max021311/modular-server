import { getServices } from '#src/service/index.js'
import { Services } from '#src/service/types.js'
import connectionManager from '#src/common/bd/index.js'
import fp from 'fastify-plugin'

export default fp(async (fastify) => {
  const services = getServices({
    logger: fastify.log,
    connectionManager
  })

  fastify.decorate('services', services)
})

declare module 'fastify' {
  export interface FastifyInstance {
    services: Services;
  }
}
