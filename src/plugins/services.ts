import { getServices } from '#src/service'
import { Services } from '#src/service/types'
import connectionManager from '#src/common/bd'
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
