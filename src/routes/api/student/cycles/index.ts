import { FastifyPluginAsync } from 'fastify'
import { JsonSchemaToTsProvider } from '@fastify/type-provider-json-schema-to-ts'
import { JSONSchema } from 'json-schema-to-ts'
import { fastifyErrorSchema } from '#src/common/schemas.js'
import verifyStudentToken from '#src/prehandlers/verify-student-token.js'

const routesPlugin: FastifyPluginAsync = async function routesPlugin (fastify) {
  const server = fastify.withTypeProvider<JsonSchemaToTsProvider>()

  server.route({
    method: 'GET',
    url: '/current',
    schema: {
      description: 'Get the current cycle',
      headers: {
        type: 'object',
        properties: {
          authorization: { type: 'string', description: 'A JWT token with scope `student`' }
        },
        required: ['authorization']
      } as const satisfies JSONSchema,
      tags: ['Cycles'],
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            slug: { type: 'string' },
            isCurrent: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          },
          required: ['id', 'slug', 'isCurrent', 'createdAt', 'updatedAt'],
          additionalProperties: false
        } as const satisfies JSONSchema,
        404: fastifyErrorSchema
      }
    },
    preHandler: verifyStudentToken,
    async handler (request, reply) {
      const currentCycle = await request.server.services.cycleService().findCurrent()

      if (!currentCycle) {
        await reply.status(404).send({ message: 'No current cycle found' })
        return
      }

      await reply.status(200).send({
        ...currentCycle,
        createdAt: currentCycle.createdAt.toISOString(),
        updatedAt: currentCycle.updatedAt.toISOString()
      })
    }
  })
}

export default routesPlugin
