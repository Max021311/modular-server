import { JsonSchemaToTsProvider } from '@fastify/type-provider-json-schema-to-ts'
import { JSONSchema } from 'json-schema-to-ts'
import { FastifyPluginAsync } from 'fastify'

const routesPlugin: FastifyPluginAsync = async function routesPlugin (fastify) {
  const server = fastify.withTypeProvider<JsonSchemaToTsProvider>()

  const careerResponseSchema = {
    type: 'object',
    properties: {
      id: { type: 'integer' },
      name: { type: 'string' },
      slug: { type: 'string' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' }
    },
    required: ['id', 'name', 'slug', 'createdAt', 'updatedAt']
  } as const satisfies JSONSchema

  server.route({
    method: 'GET',
    url: '/',
    schema: {
      description: 'Get all careers',
      tags: ['Careers'],
      response: {
        200: {
          type: 'array',
          items: careerResponseSchema
        } as const satisfies JSONSchema
      }
    },
    async handler (request, reply) {
      const services = request.server.services
      const careers = await services.careerService().findAll()

      const records = careers.map(career => ({
        ...career,
        createdAt: career.createdAt.toISOString(),
        updatedAt: career.updatedAt.toISOString()
      }))

      await reply.status(200).send(records)
    }
  })
}

export default routesPlugin
