import { JsonSchemaToTsProvider } from '@fastify/type-provider-json-schema-to-ts'
import { JSONSchema } from 'json-schema-to-ts'
import config from '../../common/configuration'
import TOKEN_SCOPES from '#src/common/token-scopes'
import { FastifyPluginAsync } from 'fastify'
import { HttpError } from '#src/common/error'
import { TokenExpiredError, JsonWebTokenError, NotBeforeError } from 'jsonwebtoken'
import verifyUserToken from '#src/prehandlers/verify-user-token'

const routesPlugin: FastifyPluginAsync = async function routesPlugin (fastify) {
  const server = fastify.withTypeProvider<JsonSchemaToTsProvider>()

  const inviteBodySchema = {
    type: 'object',
    properties: {
      email: {
        type: 'string',
        format: 'email'
      }
    },
    required: ['email']
  } as const satisfies JSONSchema

  const addStudentBodySchema = {
    type: 'object',
    properties: {
      name: {
        type: 'string'
      },
      code: {
        type: 'string'
      },
      password: {
        type: 'string'
      },
      careerId: {
        type: 'integer'
      },
      telephone: {
        type: 'string'
      }
    },
    required: ['name', 'code', 'password', 'careerId', 'telephone']
  } as const satisfies JSONSchema

  const studentResponseSchema = {
    type: 'object',
    properties: {
      id: { type: 'integer' },
      name: { type: 'string' },
      code: { type: 'string' },
      careerId: { type: 'integer' },
      email: { type: 'string' },
      telephone: { type: 'string' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' }
    }
  } as const satisfies JSONSchema

  const studentsQuerySchema = {
    type: 'object',
    properties: {
      order: {
        type: 'string',
        enum: ['createdAt', '-createdAt'],
        description: "Order by the field name. A minus(-) means that we'll order the file collections in descending order.",
        default: '-createdAt'
      },
      limit: {
        type: 'integer',
        minimum: 1,
        maximum: 50,
        default: 50
      },
      offset: {
        type: 'integer',
        minimum: 0,
        default: 0
      }
    }
  } as const satisfies JSONSchema

  const updateStudentBodySchema = {
    type: 'object',
    properties: {
      name: {
        type: 'string'
      },
      code: {
        type: 'string'
      },
      careerId: {
        type: 'integer'
      },
      email: {
        type: 'string',
        format: 'email'
      },
      telephone: {
        type: 'string'
      }
    },
    additionalProperties: false
  } as const satisfies JSONSchema

  server.route({
    method: 'POST',
    url: '/invite',
    schema: {
      body: inviteBodySchema,
      response: {
        204: {
          type: 'null'
        } as const satisfies JSONSchema
      }
    },
    preHandler: verifyUserToken,
    async handler (request, reply) {
      const services = request.server.services
      const email = request.body.email
      const token = await services.jwtService().sign({
        email,
        scope: TOKEN_SCOPES.INVITE_USER
      })
      await services.emailService().sendInviteEmail({
        email,
        completionUrl: `${config.webUrl}/invite?${token}`
      })
      await reply.status(204).send(null)
    }
  })

  server.route({
    method: 'POST',
    url: '/add',
    schema: {
      headers: {
        type: 'object',
        properties: {
          authorization: { type: 'string' }
        },
        required: ['authorization']
      } as const satisfies JSONSchema,
      body: addStudentBodySchema,
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

      const email = decoded.email
      const studentData = {
        ...request.body,
        email,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const student = await services.studentService().createStudent({
        ...studentData,
        password: await services.bcryptService().hash(studentData.password)
      })
      await reply.status(201).send(student)
    }
  })

  server.route({
    method: 'GET',
    url: '/',
    schema: {
      querystring: studentsQuerySchema,
      response: {
        200: {
          type: 'object',
          properties: {
            total: { type: 'integer' },
            records: {
              type: 'array',
              items: studentResponseSchema
            }
          }
        } as const satisfies JSONSchema
      }
    },
    preHandler: verifyUserToken,
    async handler (request, reply) {
      const services = request.server.services
      const { limit = 50, offset = 0 } = request.query

      const result = await services.studentService().findAndCount({
        limit,
        offset
      })

      const records = result.records.map(record => {
        return {
          ...record,
          createdAt: record.createdAt.toISOString(),
          updatedAt: record.updatedAt.toISOString()
        }
      })

      await reply.status(200).send({
        total: result.total,
        records
      })
    }
  })

  server.route({
    method: 'PATCH',
    url: '/:id',
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'integer' }
        },
        required: ['id']
      } as const satisfies JSONSchema,
      body: updateStudentBodySchema,
      response: {
        204: {
          type: 'null'
        } as const satisfies JSONSchema
      }
    },
    preHandler: verifyUserToken,
    async handler (request, reply) {
      const services = request.server.services
      const { id } = request.params
      const updateData = { ...request.body }

      await services.studentService().updateStudent(id, updateData)
      await reply.status(204).send(null)
    }
  })
}

export default routesPlugin
