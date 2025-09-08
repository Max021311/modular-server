import fp from 'fastify-plugin'
import { JsonSchemaToTsProvider } from '@fastify/type-provider-json-schema-to-ts'
import { JSONSchema } from 'json-schema-to-ts'
import TOKEN_SCOPES from '../common/token-scopes'
import buildVerifyUserToken from '../prehandlers/verify-user-token'
import { PERMISSIONS } from '#src/common/permissions'
import config from '#src/common/configuration'

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

  const inviteUserBodySchema = {
    type: 'object',
    properties: {
      name: { type: 'string' },
      user: {
        type: 'string',
        format: 'email'
      },
      role: {
        type: 'string',
        enum: ['admin', 'member', 'base']
      },
      permissions: {
        type: 'array',
        items: { type: 'string' }
      }
    },
    required: ['name', 'user', 'role', 'permissions']
  } as const satisfies JSONSchema

  server.route({
    method: 'POST',
    url: '/user/auth',
    schema: {
      tags: ['Users'],
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
      const token = await request.server.services.userService().login(request.body.user, request.body.password)
      await reply.status(200).send({ token })
    }
  })

  server.route({
    method: 'GET',
    url: '/user/auth',
    schema: {
      tags: ['Users'],
      headers: {
        type: 'object',
        properties: {
          authorization: { type: 'string' }
        },
        required: ['authorization']
      } as const satisfies JSONSchema
    },
    preHandler: buildVerifyUserToken([]),
    handler (request, reply) {
      server.log.info(request.user, 'User verified')
      reply.status(200).send('ok')
    }
  })

  server.route({
    method: 'POST',
    url: '/user/invite',
    schema: {
      tags: ['Users'],
      body: inviteUserBodySchema,
      response: {
        204: {
          type: 'null'
        } as const satisfies JSONSchema
      }
    },
    preHandler: buildVerifyUserToken([PERMISSIONS.INVITE_USER]),
    async handler (request, reply) {
      const { services } = request.server
      const payload = {
        ...request.body,
        scope: TOKEN_SCOPES.INVITE_USER
      }
      const token = await services.jwtService().sign(payload)
      await services.emailService().sendInviteStudentEmail({
        email: payload.user,
        completionUrl: `${config.webUrl}/invite-user?${token}`
      })
      await reply.status(200).send(null)
    }
  })
})
