import fp from 'fastify-plugin'
import userRoutesPlugin from './user'

export default fp(async function RoutesPlugin (fastify) {
  fastify.register(userRoutesPlugin, { prefix: '/user' })
})
