import fp from 'fastify-plugin'
import userRoutesPlugin from './user.js'
import studentsRoutesPlugin from './students/index.js'
import careersRoutesPlugin from './careers/index.js'
import departmentsRoutesPlugin from './departments/index.js'
import cyclesRoutesPlugin from './cycles/index.js'

export default fp(async function RoutesPlugin (fastify) {
  fastify.register(userRoutesPlugin, { prefix: '/user' })
  fastify.register(studentsRoutesPlugin, { prefix: '/students' })
  fastify.register(careersRoutesPlugin, { prefix: '/careers' })
  fastify.register(departmentsRoutesPlugin, { prefix: '/departments' })
  fastify.register(cyclesRoutesPlugin, { prefix: '/cycles' })
})
