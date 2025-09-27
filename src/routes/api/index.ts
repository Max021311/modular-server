import { FastifyPluginAsync } from 'fastify'
import studentApiPlugin from './student/index.js'

const routesPlugin: FastifyPluginAsync = async function routesPlugin (fastify) {
  fastify.register(studentApiPlugin, { prefix: '/student' })
}
export default routesPlugin
