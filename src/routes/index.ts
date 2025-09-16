import fp from 'fastify-plugin'
import userRoutesPlugin from './user'
import studentsRoutesPlugin from './students'
import careersRoutesPlugin from './careers'
import departmentsRoutesPlugin from './departments/'

export default fp(async function RoutesPlugin (fastify) {
  fastify.register(userRoutesPlugin, { prefix: '/user' })
  fastify.register(studentsRoutesPlugin, { prefix: '/students' })
  fastify.register(careersRoutesPlugin, { prefix: '/careers' })
  fastify.register(departmentsRoutesPlugin, { prefix: '/departments' })
})
