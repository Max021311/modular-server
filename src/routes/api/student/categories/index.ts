import { JsonSchemaToTsProvider } from '@fastify/type-provider-json-schema-to-ts'
import { JSONSchema } from 'json-schema-to-ts'
import { FastifyPluginAsync } from 'fastify'
import verifyStudentToken from '#src/prehandlers/verify-student-token.js'
import { orderQueryToOrder } from '#src/common/order-query.js'

const routesPlugin: FastifyPluginAsync = async function routesPlugin (fastify) {
  const server = fastify.withTypeProvider<JsonSchemaToTsProvider>()

  const categoryResponseSchema = {
    type: 'object',
    properties: {
      id: { type: 'integer' },
      name: { type: 'string' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' }
    },
    required: ['id', 'name', 'createdAt', 'updatedAt']
  } as const satisfies JSONSchema

  server.route({
    method: 'GET',
    url: '/',
    schema: {
      description: 'Get all categories for students',
      tags: ['Student Categories'],
      headers: {
        type: 'object',
        properties: {
          authorization: { type: 'string', description: 'A JWT token with scope `student`' }
        },
        required: ['authorization']
      } as const satisfies JSONSchema,
      querystring: {
        type: 'object',
        properties: {
          search: { type: 'string' },
          order: {
            type: 'string',
            enum: ['Categories.createdAt', '-Categories.createdAt', 'Categories.id', '-Categories.id'],
            description: "Order by the field name. A minus(-) means that we'll order the file collections in descending order.",
            default: 'Categories.name'
          }
        },
        additionalProperties: false
      } as const satisfies JSONSchema,
      response: {
        200: {
          type: 'array',
          items: categoryResponseSchema
        } as const satisfies JSONSchema
      }
    },
    preHandler: verifyStudentToken,
    async handler (request, reply) {
      const services = request.server.services

      const categories = await services.categoryService().findAll({
        search: request.query.search,
        order: orderQueryToOrder(request.query.order) ?? undefined
      })

      const records = categories.map((category) => ({
        ...category,
        createdAt: category.createdAt.toISOString(),
        updatedAt: category.updatedAt.toISOString()
      }))

      await reply.status(200).send(records)
    }
  })
}

export default routesPlugin
