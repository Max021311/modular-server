import { FastifyPluginAsync } from 'fastify'
import { JsonSchemaToTsProvider } from '@fastify/type-provider-json-schema-to-ts'
import { JSONSchema } from 'json-schema-to-ts'
import { fastifyErrorSchema } from '#src/common/schemas.js'
import verifyStudentToken from '#src/prehandlers/verify-student-token.js'
import { HttpError } from '#src/common/error.js'
import type { MultipartFile } from '@fastify/multipart'
import axios from 'axios'
import pg from 'pg'
const { DatabaseError } = pg

const routesPlugin: FastifyPluginAsync = async function routesPlugin (fastify) {
  const server = fastify.withTypeProvider<JsonSchemaToTsProvider>()

  const comissionOfficeResponseSchema = {
    type: 'object',
    properties: {
      id: { type: 'integer' },
      studentId: { type: 'integer' },
      vacancyId: { type: 'integer' },
      cycleId: { type: 'integer' },
      beginDate: { type: 'string', format: 'date' },
      status: { type: 'string', enum: ['APPROVED', 'REJECTED', 'PENDING'] },
      fileId: { type: 'integer' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
      cycle: {
        description: 'This field is only available if the endpoint supports including the association',
        type: 'object',
        properties: {
          id: { type: 'integer' },
          slug: { type: 'string' },
          isCurrent: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      }
    },
    required: ['id', 'studentId', 'vacancyId', 'cycleId', 'beginDate', 'status', 'fileId', 'createdAt', 'updatedAt']
  } as const satisfies JSONSchema

  const comissionOfficesQuerySchema = {
    type: 'object',
    properties: {
      vacancyId: { type: 'integer', description: 'Filter by vacancy ID' },
      includeCycle: { type: 'boolean', description: 'Include the field `cycle` if enabled', default: false }
    },
    required: ['vacancyId']
  } as const satisfies JSONSchema

  server.route({
    method: 'GET',
    url: '/',
    schema: {
      description: 'Get the commission office for the authenticated student and specific vacancy',
      tags: ['Student Commission Offices'],
      headers: {
        type: 'object',
        properties: {
          authorization: { type: 'string', description: 'A JWT token with scope `student`' }
        },
        required: ['authorization']
      } as const satisfies JSONSchema,
      querystring: comissionOfficesQuerySchema,
      response: {
        200: comissionOfficeResponseSchema,
        404: fastifyErrorSchema
      }
    },
    preHandler: verifyStudentToken,
    async handler (request, reply) {
      const services = request.server.services
      const studentId = request.student.id
      const {
        vacancyId,
        includeCycle = false
      } = request.query

      const result = await services.comissionOfficeService().findAndCount({
        limit: 1,
        offset: 0,
        studentId,
        vacancyId,
        includeCycle,
        includeStudent: false,
        includeVacancy: false
      })

      if (result.records.length === 0) {
        throw new HttpError('Commission office not found for this student and vacancy', 404)
      }

      const record = result.records[0]
      const response = {
        ...record,
        beginDate: record.beginDate.toISOString().split('T')[0],
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString(),
        cycle: record.cycle !== undefined
          ? {
              ...record.cycle,
              createdAt: record.cycle.createdAt.toISOString(),
              updatedAt: record.cycle.updatedAt.toISOString()
            }
          : undefined
      }

      await reply.status(200).send(response)
    }
  })

  server.route({
    method: 'POST',
    url: '/',
    schema: {
      description: 'Create a new commission office document for the authenticated student',
      tags: ['Student Commission Offices'],
      headers: {
        type: 'object',
        properties: {
          authorization: { type: 'string', description: 'A JWT token with scope `student`' }
        },
        required: ['authorization']
      } as const satisfies JSONSchema,
      consumes: ['multipart/form-data'],
      body: {
        type: 'object',
        properties: {
          vacancyId: {
            type: 'object',
            properties: {
              value: { type: 'integer', description: 'Vacancy ID' }
            },
            required: ['value']
          },
          beginDate: {
            type: 'object',
            properties: {
              value: { type: 'string', format: 'date', description: 'Begin date (YYYY-MM-DD)' }
            },
            required: ['value']
          },
          file: {
            type: 'object',
            properties: {
              encoding: { type: 'string' },
              filename: { type: 'string' },
              limit: { type: 'boolean' },
              mimetype: { type: 'string' }
            },
            description: 'Commission office document file'
          }
        },
        required: ['vacancyId', 'beginDate', 'file']
      } as const satisfies JSONSchema,
      response: {
        201: comissionOfficeResponseSchema,
        400: fastifyErrorSchema,
        404: fastifyErrorSchema,
        409: fastifyErrorSchema
      }
    },
    preHandler: verifyStudentToken,
    async handler (request, reply) {
      const services = request.server.services
      const studentId = request.student.id

      const body = request.body

      const vacancyId = body.vacancyId.value
      const beginDate = body.beginDate.value
      const file = body.file as unknown as MultipartFile

      const vacancy = await services.vacancyService().findById(vacancyId)

      if (vacancy === null) {
        throw new HttpError('Vacancy not found', 404)
      }

      const association = await services.vacancyService().getAssociation(studentId, vacancy.id)

      if (association === null) {
        throw new HttpError('The student is not associated with the vacancy', 409)
      }

      try {
        const { id: fileId } = await services.fileService().create({
          name: file.filename
        }, await file.toBuffer())

        const result = await services.comissionOfficeService().create({
          studentId,
          vacancyId,
          cycleId: vacancy.cycleId,
          beginDate: new Date(beginDate),
          status: 'PENDING',
          fileId
        })

        const record = {
          ...result,
          beginDate: result.beginDate.toISOString().split('T')[0],
          createdAt: result.createdAt.toISOString(),
          updatedAt: result.updatedAt.toISOString()
        }

        await reply.status(201).send(record)
      } catch (error) {
        if (error instanceof DatabaseError && error.code === '23505') {
          throw new HttpError('The commission office document already exists', 409)
        }
        throw error
      }
    }
  })

  server.route({
    method: 'DELETE',
    url: '/:id',
    schema: {
      description: 'Delete a commission office document for the authenticated student (only if status is PENDING or REJECTED)',
      tags: ['Student Commission Offices'],
      headers: {
        type: 'object',
        properties: {
          authorization: { type: 'string', description: 'A JWT token with scope `student`' }
        },
        required: ['authorization']
      } as const satisfies JSONSchema,
      params: {
        type: 'object',
        properties: {
          id: { type: 'integer', description: 'Commission office document ID' }
        },
        required: ['id']
      } as const satisfies JSONSchema,
      response: {
        204: {
          type: 'null'
        } as const satisfies JSONSchema,
        403: fastifyErrorSchema,
        404: fastifyErrorSchema,
        409: fastifyErrorSchema
      }
    },
    preHandler: verifyStudentToken,
    async handler (request, reply) {
      const services = request.server.services
      const studentId = request.student.id
      const { id } = request.params

      const comissionOffice = await services.comissionOfficeService().getById(id)

      if (comissionOffice === null) {
        throw new HttpError('Commission office document not found', 404)
      }

      if (comissionOffice.studentId !== studentId) {
        throw new HttpError('Access denied: Commission office document does not belong to the authenticated student', 403)
      }

      if (comissionOffice.status === 'APPROVED') {
        throw new HttpError('Cannot delete an approved commission office document', 409)
      }

      await services.comissionOfficeService().delete(id)

      await reply.status(204).send()
    }
  })

  server.route({
    method: 'GET',
    url: '/:id/download',
    schema: {
      description: 'Download a commission office document file for the authenticated student',
      tags: ['Student Commission Offices'],
      headers: {
        type: 'object',
        properties: {
          authorization: { type: 'string', description: 'A JWT token with scope `student`' }
        },
        required: ['authorization']
      } as const satisfies JSONSchema,
      params: {
        type: 'object',
        properties: {
          id: { type: 'integer', description: 'Commission office document ID' }
        },
        required: ['id']
      } as const satisfies JSONSchema,
      response: {
        200: {
          type: 'string',
          format: 'binary'
        } as const satisfies JSONSchema,
        403: fastifyErrorSchema,
        404: fastifyErrorSchema,
        500: fastifyErrorSchema
      }
    },
    preHandler: verifyStudentToken,
    async handler (request, reply) {
      const services = request.server.services
      const studentId = request.student.id
      const { id } = request.params

      const comissionOffice = await services.comissionOfficeService().getById(id)

      if (comissionOffice === null) {
        throw new HttpError('Commission office document not found', 404)
      }

      if (comissionOffice.studentId !== studentId) {
        throw new HttpError('Access denied: Commission office document does not belong to the authenticated student', 403)
      }

      const file = await services.fileService().getById(comissionOffice.fileId)

      if (file === null) {
        throw new HttpError('File not found', 404)
      }

      const response = await axios.get(file.url, {
        responseType: 'stream'
      })

      reply.header('Content-Disposition', `attachment; filename="${file.name}"`)
      reply.header('Content-Type', 'application/octet-stream')

      await reply.send(response.data)
    }
  })
}

export default routesPlugin
