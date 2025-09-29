import { JsonSchemaToTsProvider } from '@fastify/type-provider-json-schema-to-ts'
import { JSONSchema } from 'json-schema-to-ts'
import config from '../../common/configuration.js'
import TOKEN_SCOPES from '#src/common/token-scopes.js'
import { FastifyPluginAsync } from 'fastify'
import { HttpError } from '#src/common/error.js'
import jwt from 'jsonwebtoken'
import { fastifyErrorSchema } from '#src/common/schemas.js'
import { orderQueryToOrder } from '#src/common/order-query.js'
import buildVerifyUserToken from '#src/prehandlers/verify-user-token.js'
import { PERMISSIONS } from '#src/common/permissions.js'
import pg from 'pg'

const { DatabaseError } = pg
const { TokenExpiredError, JsonWebTokenError, NotBeforeError } = jwt

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
      updatedAt: { type: 'string', format: 'date-time' },
      deletedAt: { type: 'string', format: 'date-time', nullable: true }
    }
  } as const satisfies JSONSchema

  const studentWithCareerResponseSchema = {
    type: 'object',
    properties: {
      ...studentResponseSchema.properties,
      career: {
        description: 'This field is only available if the endpoint support include the association',
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          slug: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      }
    },
    required: ['id', 'name', 'code', 'careerId', 'email', 'telephone', 'createdAt', 'updatedAt']
  } as const satisfies JSONSchema

  const studentsQuerySchema = {
    type: 'object',
    properties: {
      order: {
        type: 'string',
        enum: ['Students.createdAt', '-Students.createdAt', 'Students.id', '-Students.id'],
        description: "Order by the field name. A minus(-) means that we'll order the file collections in descending order.",
        default: '-Students.createdAt'
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
      },
      includeCareer: { type: 'boolean', description: 'Include the field `career` if is enabled' },
      search: { type: 'string' }
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
      description: `Endpoint to invite a new student. This endpoint require the user permission \`${PERMISSIONS.INVITE_STUDENT}\``,
      tags: ['Students'],
      body: inviteBodySchema,
      response: {
        204: {
          type: 'null'
        } as const satisfies JSONSchema
      }
    },
    preHandler: buildVerifyUserToken([PERMISSIONS.INVITE_STUDENT]),
    async handler (request, reply) {
      const services = request.server.services
      const email = request.body.email
      const student = await services.studentService().findByEmail(email)
      if (student !== null) throw new HttpError('Email already registered', 409)
      const token = await services.jwtService().sign({
        email,
        scope: TOKEN_SCOPES.INVITE_STUDENT
      })
      await services.emailService().sendInviteStudentEmail({
        email,
        completionUrl: `${config.webUrl}/registro-alumno?token=${token}`
      })
      await reply.status(204).send(null)
    }
  })

  server.route({
    method: 'POST',
    url: '/add',
    schema: {
      tags: ['Students'],
      headers: {
        type: 'object',
        properties: {
          authorization: { type: 'string', description: 'A JWT token with scope `invite-user`' }
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

      if (decoded === undefined || decoded.scope !== TOKEN_SCOPES.INVITE_STUDENT) {
        throw new HttpError('Invalid token', 403)
      }

      const email = decoded.email
      const studentData = {
        ...request.body,
        email,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      try {
        const student = await services.studentService().createStudent({
          ...studentData,
          password: await services.bcryptService().hash(studentData.password)
        })
        await reply.status(201).send(student)
      } catch (error) {
        if (error instanceof DatabaseError && error.code === '23505') {
          throw new HttpError('Conflict', 409)
        }
        throw error
      }
    }
  })

  server.route({
    method: 'GET',
    url: '/',
    schema: {
      description: `Endpoint to get students with pagination. This endpoint require the user permission \`${PERMISSIONS.VIEW_STUDENT}\``,
      tags: ['Students'],
      headers: {
        type: 'object',
        properties: {
          authorization: { type: 'string', description: 'A JWT token with scope `user`' }
        },
        required: ['authorization']
      } as const satisfies JSONSchema,
      querystring: studentsQuerySchema,
      response: {
        200: {
          type: 'object',
          properties: {
            total: { type: 'integer' },
            records: {
              type: 'array',
              items: studentWithCareerResponseSchema
            }
          }
        } as const satisfies JSONSchema
      }
    },
    preHandler: buildVerifyUserToken([PERMISSIONS.VIEW_STUDENT]),
    async handler (request, reply) {
      const services = request.server.services
      const {
        limit = 50,
        offset = 0,
        order,
        includeCareer,
        search
      } = request.query

      const result = await services.studentService().findAndCount({
        limit,
        offset,
        order: orderQueryToOrder(order) ?? undefined,
        includeCareer,
        search
      })

      const records = result.records.map(record => {
        const career = record.career
        return {
          ...record,
          createdAt: record.createdAt.toISOString(),
          updatedAt: record.updatedAt.toISOString(),
          deletedAt: record.deletedAt === null ? null : record.deletedAt.toISOString(),
          career: career !== undefined
            ? {
                ...career,
                createdAt: career.createdAt.toISOString(),
                updatedAt: career.updatedAt.toISOString()
              }
            : undefined
        }
      })

      await reply.status(200).send({
        total: result.total,
        records
      })
    }
  })

  server.route({
    method: 'GET',
    url: '/:id',
    schema: {
      description: `Endpoint to get a students data. This endpoint require the user permission \`${PERMISSIONS.VIEW_STUDENT}\``,
      tags: ['Students'],
      querystring: {
        type: 'object',
        properties: {
          includeCareer: { type: 'boolean', description: 'Include the field `career` if is enabled' }
        },
        additionalProperties: false
      } as const satisfies JSONSchema,
      headers: {
        type: 'object',
        properties: {
          authorization: { type: 'string', description: 'A JWT token with scope `user`' }
        },
        required: ['authorization']
      } as const satisfies JSONSchema,
      params: {
        type: 'object',
        properties: {
          id: { type: 'integer' }
        },
        required: ['id']
      } as const satisfies JSONSchema,
      response: {
        200: studentWithCareerResponseSchema,
        400: fastifyErrorSchema,
        404: fastifyErrorSchema
      }
    },
    preHandler: buildVerifyUserToken([PERMISSIONS.VIEW_STUDENT]),
    async handler (request, reply) {
      const services = request.server.services
      const { id } = request.params

      const student = await services.studentService().findById(id, {
        includeCareer: request.query.includeCareer
      })

      if (!student) {
        throw new HttpError('Student not found', 404)
      }

      await reply.status(200).send({
        ...student,
        createdAt: student.createdAt.toISOString(),
        updatedAt: student.updatedAt.toISOString(),
        deletedAt: student.deletedAt === null ? null : student.deletedAt.toISOString(),
        career: student.career !== undefined
          ? {
              ...student.career,
              createdAt: student.career.createdAt.toISOString(),
              updatedAt: student.career.updatedAt.toISOString()
            }
          : undefined
      })
    }
  })

  server.route({
    method: 'PATCH',
    url: '/:id',
    schema: {
      description: `Endpoint to edit student data. This endpoint require the user permission \`${PERMISSIONS.EDIT_STUDENT}\``,
      tags: ['Students'],
      headers: {
        type: 'object',
        properties: {
          authorization: { type: 'string', description: 'A JWT token with scope `user`' }
        },
        required: ['authorization']
      } as const satisfies JSONSchema,
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
        } as const satisfies JSONSchema,
        409: fastifyErrorSchema
      }
    },
    preHandler: buildVerifyUserToken([PERMISSIONS.EDIT_STUDENT]),
    async handler (request, reply) {
      try {
        const services = request.server.services
        const { id } = request.params
        const updateData = { ...request.body }

        await services.studentService().updateStudent(id, updateData)
        await reply.status(204).send(null)
      } catch (error) {
        if (error instanceof DatabaseError && error.code === '23505') {
          throw new HttpError('Conflict: email, telephone or code already in use', 409)
        }
        throw error
      }
    }
  })

  server.route({
    method: 'PATCH',
    url: '/:id/deactivate',
    schema: {
      description: `Endpoint to deactivate a student (soft delete). This endpoint require the user permission \`${PERMISSIONS.EDIT_STUDENT}\``,
      tags: ['Students'],
      headers: {
        type: 'object',
        properties: {
          authorization: { type: 'string', description: 'A JWT token with scope `user`' }
        },
        required: ['authorization']
      } as const satisfies JSONSchema,
      params: {
        type: 'object',
        properties: {
          id: { type: 'integer', description: 'Student ID' }
        },
        required: ['id']
      } as const satisfies JSONSchema,
      response: {
        200: studentResponseSchema,
        404: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        } as const satisfies JSONSchema,
        409: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        } as const satisfies JSONSchema
      }
    },
    preHandler: buildVerifyUserToken([PERMISSIONS.EDIT_STUDENT]),
    async handler (request, reply) {
      const services = request.server.services
      const { id } = request.params

      const studentWithDeletedAt = await services.studentService().findById(id)

      if (!studentWithDeletedAt) {
        await reply.status(404).send({
          message: 'Student not found'
        })
        return
      }

      if (studentWithDeletedAt.deletedAt) {
        await reply.status(409).send({
          message: 'Student is already deactivated'
        })
        return
      }

      // Deactivate the student
      const updatedStudent = await services.studentService().deactivate(id)

      await reply.status(200).send({
        ...updatedStudent,
        createdAt: updatedStudent.createdAt.toISOString(),
        updatedAt: updatedStudent.updatedAt.toISOString(),
        deletedAt: updatedStudent.deletedAt === null ? null : updatedStudent.deletedAt.toISOString()
      })
    }
  })

  server.route({
    method: 'PATCH',
    url: '/:id/activate',
    schema: {
      description: `Endpoint to activate a student (restore from soft delete). This endpoint require the user permission \`${PERMISSIONS.EDIT_STUDENT}\``,
      tags: ['Students'],
      headers: {
        type: 'object',
        properties: {
          authorization: { type: 'string', description: 'A JWT token with scope `user`' }
        },
        required: ['authorization']
      } as const satisfies JSONSchema,
      params: {
        type: 'object',
        properties: {
          id: { type: 'integer', description: 'Student ID' }
        },
        required: ['id']
      } as const satisfies JSONSchema,
      response: {
        200: studentResponseSchema,
        404: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        } as const satisfies JSONSchema,
        409: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        } as const satisfies JSONSchema
      }
    },
    preHandler: buildVerifyUserToken([PERMISSIONS.EDIT_STUDENT]),
    async handler (request, reply) {
      const services = request.server.services
      const { id } = request.params

      const studentWithDeletedAt = await services.studentService().findById(id)

      if (!studentWithDeletedAt) {
        await reply.status(404).send({
          message: 'Student not found'
        })
        return
      }

      if (!studentWithDeletedAt.deletedAt) {
        await reply.status(409).send({
          message: 'Student is already active'
        })
        return
      }

      // Activate the student
      const updatedStudent = await services.studentService().activate(id)

      await reply.status(200).send({
        ...updatedStudent,
        createdAt: updatedStudent.createdAt.toISOString(),
        updatedAt: updatedStudent.updatedAt.toISOString(),
        deletedAt: updatedStudent.deletedAt === null ? null : updatedStudent.deletedAt.toISOString()
      })
    }
  })
}

export default routesPlugin
