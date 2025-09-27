import { FastifyPluginAsync } from 'fastify'
import { JsonSchemaToTsProvider } from '@fastify/type-provider-json-schema-to-ts'
import { JSONSchema } from 'json-schema-to-ts'

const routesPlugin: FastifyPluginAsync = async function routesPlugin (fastify) {
  const server = fastify.withTypeProvider<JsonSchemaToTsProvider>()

  const loginBodySchema = {
    type: 'object',
    properties: {
      email: {
        type: 'string',
        format: 'email'
      },
      password: {
        type: 'string'
      }
    },
    required: ['email', 'password']
  } as const satisfies JSONSchema

  server.route({
    method: 'POST',
    url: '/auth',
    schema: {
      description: 'Allow log in as an student user',
      tags: ['Students'],
      body: loginBodySchema,
      response: {
        200: {
          type: 'object',
          properties: {
            token: { type: 'string' }
          },
          required: ['token'],
          additionalProperties: false
        } as const satisfies JSONSchema
      }
    },
    async handler (request, reply) {
      const token = await request.server.services.studentService().login(request.body.email, request.body.password)
      await reply.status(200).send({ token })
    }
  })
}
export default routesPlugin
