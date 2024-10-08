import fp from 'fastify-plugin'
import { JsonSchemaToTsProvider } from '@fastify/type-provider-json-schema-to-ts'
import { JSONSchema } from 'json-schema-to-ts'
import verifyUserToken from '../prehandlers/verify-user-token'
import userService from '../service/user'

export default fp(async function RoutesPlugin (fastify) {
  const server = fastify.withTypeProvider<JsonSchemaToTsProvider>()

  const loginBodySchema = {
    type: 'object',
    properties: {
      user: {
        type: 'string',
        format: 'email'
      },
      password: {
        type: 'string'
      }
    },
    required: ['user', 'password']
  } as const satisfies JSONSchema

  server.route({
    method: 'POST',
    url: '/user/auth',
    schema: {
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
      const token = await userService.login(request.body.user, request.body.password)
      await reply.status(200).send({ token })
    }
  })

  server.route({
    method: 'GET',
    url: '/user/auth',
    preHandler: verifyUserToken,
    handler (request, reply) {
      server.log.info(request.user, 'User verified')
      reply.status(200).send('ok')
    }
  })
})
