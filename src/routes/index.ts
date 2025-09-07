import fp from 'fastify-plugin'
import userRoutesPlugin from './user'
import studentsRoutesPlugin from './students'

export default fp(async function RoutesPlugin (fastify) {
  fastify.register(userRoutesPlugin, { prefix: '/user' })
  fastify.register(studentsRoutesPlugin, { prefix: '/students' })
})
