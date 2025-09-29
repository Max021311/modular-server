import fp from 'fastify-plugin'
import { JsonSchemaToTsProvider } from '@fastify/type-provider-json-schema-to-ts'
import { JSONSchema } from 'json-schema-to-ts'
import TOKEN_SCOPES from '../common/token-scopes.js'
import buildVerifyUserToken from '../prehandlers/verify-user-token.js'
import { PERMISSIONS } from '#src/common/permissions.js'
import config from '#src/common/configuration.js'
import { HttpError } from '#src/common/error.js'
import { orderQueryToOrder } from '#src/common/order-query.js'
import jwt from 'jsonwebtoken'
const { TokenExpiredError, JsonWebTokenError, NotBeforeError } = jwt

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

  const recoverPasswordBodySchema = {
    type: 'object',
    properties: {
      email: {
        type: 'string',
        format: 'email'
      }
    },
    required: ['email']
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
        items: {
          type: 'string',
          enum: Object.values(PERMISSIONS)
        }
      }
    },
    required: ['name', 'user', 'role', 'permissions']
  } as const satisfies JSONSchema

  const addUserBodySchema = {
    type: 'object',
    properties: {
      password: {
        type: 'string'
      }
    },
    required: ['password']
  } as const satisfies JSONSchema

  const userResponseSchema = {
    type: 'object',
    properties: {
      id: { type: 'integer' },
      name: { type: 'string' },
      user: { type: 'string' },
      role: { type: 'string' },
      permissions: {
        type: 'array',
        items: { type: 'string' }
      },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' }
    },
    required: ['id', 'name', 'user', 'role', 'permissions', 'createdAt', 'updatedAt']
  } as const satisfies JSONSchema

  const usersQuerySchema = {
    type: 'object',
    properties: {
      order: {
        type: 'string',
        enum: ['Users.createdAt', '-Users.createdAt', 'Users.id', '-Users.id', 'Users.name', '-Users.name', 'Users.user', '-Users.user'],
        description: "Order by the field name. A minus(-) means that we'll order the file collections in descending order.",
        default: '-Users.createdAt'
      },
      limit: {
        type: 'integer',
        minimum: 1,
        maximum: 50,
        default: 10
      },
      offset: {
        type: 'integer',
        minimum: 0,
        default: 0
      },
      search: { type: 'string' }
    }
  } as const satisfies JSONSchema

  server.route({
    method: 'POST',
    url: '/user/auth',
    schema: {
      description: 'Allow log in as an administrative user',
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
    url: '/user/recover-password',
    schema: {
      description: 'Send password recovery email to user',
      tags: ['Users'],
      body: recoverPasswordBodySchema,
      response: {
        204: {
          type: 'null'
        } as const satisfies JSONSchema,
        404: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        } as const satisfies JSONSchema
      }
    },
    async handler (request, reply) {
      const services = request.server.services
      const { email } = request.body

      const user = await services.userService().getByEmail(email)
      if (!user) {
        throw new HttpError('User not found', 404)
      }

      const token = await services.jwtService().sign({
        id: user.id,
        scope: 'recover-user-password'
      })

      await services.emailService().sendRecoverUserPassword({
        email: user.user,
        url: `${config.webUrl}/recuperar-contrasena-administrativo?token=${token}`
      })

      await reply.status(204).send(null)
    }
  })

  server.route({
    method: 'POST',
    url: '/user/set-password',
    schema: {
      description: 'Set new password using recovery token',
      tags: ['Users'],
      headers: {
        type: 'object',
        properties: {
          authorization: { type: 'string', description: 'A JWT token with scope `recover-user-password`' }
        },
        required: ['authorization']
      } as const satisfies JSONSchema,
      body: addUserBodySchema,
      response: {
        204: {
          type: 'null'
        } as const satisfies JSONSchema,
        400: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        } as const satisfies JSONSchema,
        401: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        } as const satisfies JSONSchema,
        403: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        } as const satisfies JSONSchema,
        404: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        } as const satisfies JSONSchema
      }
    },
    async handler (request, reply) {
      const services = request.server.services
      const authHeader = request.headers.authorization
      if (!authHeader.startsWith('Bearer ')) {
        throw new HttpError('Invalid token', 401)
      }

      const token = authHeader.substring(7)
      const decoded = await services.jwtService()
        .verify(token)
        .catch((error) => {
          if (error instanceof TokenExpiredError) throw new HttpError(`Authorization token expired at ${error.expiredAt}`, 401)
          if (error instanceof JsonWebTokenError) throw new HttpError('Invalid authorization token', 400)
          if (error instanceof NotBeforeError) throw new HttpError('Invalid token', 401)
          throw error
        })

      if (decoded === undefined || decoded.scope !== 'recover-user-password') {
        throw new HttpError('Invalid token', 403)
      }

      const user = await services.userService().getById(decoded.id)
      if (!user) {
        throw new HttpError('User not found', 404)
      }

      const hashedPassword = await services.bcryptService().hash(request.body.password)

      await services.userService().update(decoded.id, {
        password: hashedPassword
      })

      await reply.status(204).send(null)
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

  server.route({
    method: 'POST',
    url: '/user/add',
    schema: {
      tags: ['Users'],
      headers: {
        type: 'object',
        properties: {
          authorization: { type: 'string', description: 'A JWT token with scope `invite-user`' }
        },
        required: ['authorization']
      } as const satisfies JSONSchema,
      body: addUserBodySchema,
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'integer' }
          }
        } as const satisfies JSONSchema
      }
    },
    async handler (request, reply) {
      const services = request.server.services
      const authHeader = request.headers.authorization
      if (!authHeader.startsWith('Bearer ')) {
        throw new HttpError('Invalid token', 401)
      }

      const token = authHeader.substring(7)
      const decoded = await services.jwtService()
        .verify(token)
        .catch((error) => {
          if (error instanceof TokenExpiredError) throw new HttpError(`Authorization token expired at ${error.expiredAt}`, 401)
          if (error instanceof JsonWebTokenError) throw new HttpError('Invalid authorization token', 400)
          if (error instanceof NotBeforeError) throw new HttpError('Invalid token', 401)
          throw error
        })

      if (decoded === undefined || decoded.scope !== TOKEN_SCOPES.INVITE_USER) {
        throw new HttpError('Invalid token', 403)
      }

      const userData = {
        name: decoded.name,
        user: decoded.user,
        role: decoded.role,
        permissions: decoded.permissions,
        password: request.body.password,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const user = await services.userService().create(userData)
      await reply.status(201).send(user)
    }
  })

  server.route({
    method: 'GET',
    url: '/users',
    schema: {
      description: `Endpoint to get users with pagination, search and ordering. This endpoint require the user permission \`${PERMISSIONS.VIEW_USER}\``,
      tags: ['Users'],
      headers: {
        type: 'object',
        properties: {
          authorization: { type: 'string', description: 'A JWT token with scope `user`' }
        },
        required: ['authorization']
      } as const satisfies JSONSchema,
      querystring: usersQuerySchema,
      response: {
        200: {
          type: 'object',
          properties: {
            total: { type: 'integer' },
            records: {
              type: 'array',
              items: userResponseSchema
            }
          }
        } as const satisfies JSONSchema
      }
    },
    preHandler: buildVerifyUserToken([PERMISSIONS.VIEW_USER]),
    async handler (request, reply) {
      const services = request.server.services
      const {
        limit = 10,
        offset = 0,
        order,
        search
      } = request.query

      const result = await services.userService().findAndCount({
        limit,
        offset,
        order: orderQueryToOrder(order) ?? undefined,
        search
      })

      const records = result.records.map(record => ({
        ...record,
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString()
      }))

      await reply.status(200).send({
        total: result.total,
        records
      })
    }
  })
})
