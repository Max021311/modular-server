import { FastifyPluginAsync } from 'fastify'
import { JsonSchemaToTsProvider } from '@fastify/type-provider-json-schema-to-ts'
import { JSONSchema } from 'json-schema-to-ts'
import cyclesApiPlugin from './cycles/index.js'
import vacanciesApiPlugin from './vacancies/index.js'
import comissionOfficesApiPlugin from './comission-offices/index.js'
import finalReportsApiPlugin from './final-reports/index.js'
import reportsApiPlugin from './reports/index.js'
import verifyStudentToken from '#src/prehandlers/verify-student-token.js'
import { fastifyErrorSchema } from '#src/common/schemas.js'
import { HttpError } from '#src/common/error.js'
import config from '#src/common/configuration.js'
import jwt from 'jsonwebtoken'

const { TokenExpiredError, JsonWebTokenError, NotBeforeError } = jwt

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

  const setPasswordBodySchema = {
    type: 'object',
    properties: {
      password: {
        type: 'string'
      }
    },
    required: ['password']
  } as const satisfies JSONSchema

  server.route({
    method: 'POST',
    url: '/recover-password',
    schema: {
      description: 'Send password recovery email to student',
      tags: ['Students'],
      body: recoverPasswordBodySchema,
      response: {
        204: {
          type: 'null'
        } as const satisfies JSONSchema,
        404: fastifyErrorSchema
      }
    },
    async handler (request, reply) {
      const services = request.server.services
      const { email } = request.body

      const student = await services.studentService().findByEmail(email)
      if (!student) {
        throw new HttpError('Student not found', 404)
      }

      const token = await services.jwtService().sign({
        id: student.id,
        scope: 'recover-student-password'
      })

      await services.emailService().sendRecoverStudentPassword({
        email: student.email,
        url: `${config.webUrl}/recuperar-contrasena-alumno?token=${token}`
      })

      await reply.status(204).send(null)
    }
  })

  server.route({
    method: 'POST',
    url: '/set-password',
    schema: {
      description: 'Set new password using recovery token',
      tags: ['Students'],
      headers: {
        type: 'object',
        properties: {
          authorization: { type: 'string', description: 'A JWT token with scope `recover-student-password`' }
        },
        required: ['authorization']
      } as const satisfies JSONSchema,
      body: setPasswordBodySchema,
      response: {
        204: {
          type: 'null'
        } as const satisfies JSONSchema,
        400: fastifyErrorSchema,
        401: fastifyErrorSchema,
        403: fastifyErrorSchema,
        404: fastifyErrorSchema
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

      if (decoded === undefined || decoded.scope !== 'recover-student-password') {
        throw new HttpError('Invalid token', 403)
      }

      const student = await services.studentService().findById(decoded.id)
      if (!student) {
        throw new HttpError('Student not found', 404)
      }

      const hashedPassword = await services.bcryptService().hash(request.body.password)

      await services.studentService().updateStudent(decoded.id, {
        password: hashedPassword
      })

      await reply.status(204).send(null)
    }
  })

  const updateStudentBodySchema = {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Student name'
      },
      telephone: {
        type: 'string',
        description: 'Student telephone number'
      }
    },
    additionalProperties: false
  } as const satisfies JSONSchema

  const studentResponseSchema = {
    type: 'object',
    properties: {
      id: { type: 'integer' },
      name: { type: 'string' },
      code: { type: 'string' },
      careerId: { type: 'integer' },
      email: { type: 'string', format: 'email' },
      telephone: { type: 'string' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' }
    },
    required: ['id', 'name', 'code', 'careerId', 'email', 'telephone', 'createdAt', 'updatedAt'],
    additionalProperties: false
  } as const satisfies JSONSchema

  const studentWithCareerResponseSchema = {
    type: 'object',
    properties: {
      ...studentResponseSchema.properties,
      career: {
        description: 'This field is only available if the endpoint supports including the association',
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
    required: ['id', 'name', 'code', 'careerId', 'email', 'telephone', 'createdAt', 'updatedAt'],
    additionalProperties: false
  } as const satisfies JSONSchema

  const updatePasswordBodySchema = {
    type: 'object',
    properties: {
      currentPassword: {
        type: 'string',
        description: 'Current password for verification'
      },
      newPassword: {
        type: 'string',
        description: 'New password to set'
      }
    },
    required: ['currentPassword', 'newPassword'],
    additionalProperties: false
  } as const satisfies JSONSchema

  server.route({
    method: 'PATCH',
    url: '/',
    schema: {
      description: 'Update student information for the authenticated student',
      tags: ['Students'],
      headers: {
        type: 'object',
        properties: {
          authorization: { type: 'string', description: 'A JWT token with scope `student`' }
        },
        required: ['authorization']
      } as const satisfies JSONSchema,
      body: updateStudentBodySchema,
      response: {
        200: studentResponseSchema,
        400: fastifyErrorSchema,
        404: fastifyErrorSchema
      }
    },
    preHandler: verifyStudentToken,
    async handler (request, reply) {
      const services = request.server.services
      const studentId = request.student.id
      const updateData = request.body

      const student = await services.studentService().findById(studentId)

      if (student === null) throw new HttpError('Student not found', 404)

      const updatedStudent = await services.studentService().updateStudent(studentId, updateData)

      const response = {
        ...updatedStudent,
        createdAt: updatedStudent.createdAt.toISOString(),
        updatedAt: updatedStudent.updatedAt.toISOString()
      }

      await reply.status(200).send(response)
    }
  })

  server.route({
    method: 'GET',
    url: '/',
    schema: {
      description: 'Get student information for the authenticated student',
      tags: ['Students'],
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
          includeCareer: { type: 'boolean', description: 'Include the field `career` if enabled', default: false }
        },
        additionalProperties: false
      } as const satisfies JSONSchema,
      response: {
        200: studentWithCareerResponseSchema,
        404: fastifyErrorSchema
      }
    },
    preHandler: verifyStudentToken,
    async handler (request, reply) {
      const services = request.server.services
      const studentId = request.student.id
      const { includeCareer = false } = request.query

      const student = await services.studentService().findById(studentId, {
        includeCareer
      })

      // Virtually impossible the pre handler throws a 401 if the user not exists, but i need the validation to make typescript happy
      if (!student) {
        throw new HttpError('Student not found', 404)
      }

      const response = {
        ...student,
        createdAt: student.createdAt.toISOString(),
        updatedAt: student.updatedAt.toISOString(),
        career: student.career !== undefined
          ? {
              ...student.career,
              createdAt: student.career.createdAt.toISOString(),
              updatedAt: student.career.updatedAt.toISOString()
            }
          : undefined
      }

      await reply.status(200).send(response)
    }
  })

  server.route({
    method: 'POST',
    url: '/update-password',
    schema: {
      description: 'Update password for the authenticated student',
      tags: ['Students'],
      headers: {
        type: 'object',
        properties: {
          authorization: { type: 'string', description: 'A JWT token with scope `student`' }
        },
        required: ['authorization']
      } as const satisfies JSONSchema,
      body: updatePasswordBodySchema,
      response: {
        204: {
          type: 'null'
        } as const satisfies JSONSchema,
        400: fastifyErrorSchema,
        401: fastifyErrorSchema,
        404: fastifyErrorSchema
      }
    },
    preHandler: verifyStudentToken,
    async handler (request, reply) {
      const services = request.server.services
      const studentId = request.student.id
      const { currentPassword, newPassword } = request.body

      const student = await services.studentService().findById(studentId)

      if (student === null) {
        throw new HttpError('Student not found', 404)
      }

      try {
        await services.studentService().login(student.email, currentPassword)
      } catch (error: unknown) {
        if (error instanceof HttpError && error.statusCode === 401) throw new HttpError('Wrong password', 401)
        throw error
      }

      const hashedNewPassword = await services.bcryptService().hash(newPassword)

      await services.studentService().updateStudent(studentId, {
        password: hashedNewPassword
      })

      await reply.status(204).send(null)
    }
  })

  fastify.register(cyclesApiPlugin, { prefix: '/cycles' })
  fastify.register(vacanciesApiPlugin, { prefix: '/vacancies' })
  fastify.register(comissionOfficesApiPlugin, { prefix: '/comission-offices' })
  fastify.register(finalReportsApiPlugin, { prefix: '/final-reports' })
  fastify.register(reportsApiPlugin, { prefix: '/reports' })
}
export default routesPlugin
