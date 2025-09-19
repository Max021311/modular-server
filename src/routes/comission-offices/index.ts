import { JsonSchemaToTsProvider } from '@fastify/type-provider-json-schema-to-ts'
import { JSONSchema } from 'json-schema-to-ts'
import { FastifyPluginAsync } from 'fastify'
import { orderQueryToOrder } from '#src/common/order-query.js'
import buildVerifyUserToken from '#src/prehandlers/verify-user-token.js'
import { PERMISSIONS } from '#src/common/permissions.js'

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
      },
      student: {
        description: 'This field is only available if the endpoint supports including the association',
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
      },
      vacancy: {
        description: 'This field is only available if the endpoint supports including the association',
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          description: { type: 'string' },
          slots: { type: 'integer' },
          cycleId: { type: 'integer' },
          departmentId: { type: 'integer' },
          disabled: { type: 'boolean' },
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
      order: {
        type: 'string',
        enum: ['ComissionOffices.createdAt', '-ComissionOffices.createdAt', 'ComissionOffices.id', '-ComissionOffices.id'],
        description: "Order by the field name. A minus(-) means that we'll order the file collections in descending order.",
        default: '-ComissionOffices.createdAt'
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
      cycleId: { type: 'integer', description: 'Filter by cycle ID' },
      studentId: { type: 'integer', description: 'Filter by student ID' },
      vacancyId: { type: 'integer', description: 'Filter by vacancy ID' },
      status: { type: 'string', enum: ['APPROVED', 'REJECTED', 'PENDING'], description: 'Filter by status' },
      includeCycle: { type: 'boolean', description: 'Include the field `cycle` if enabled' },
      includeStudent: { type: 'boolean', description: 'Include the field `student` if enabled' },
      includeVacancy: { type: 'boolean', description: 'Include the field `vacancy` if enabled' }
    }
  } as const satisfies JSONSchema

  server.route({
    method: 'GET',
    url: '/',
    schema: {
      description: `Endpoint to get comission offices with pagination and filters. This endpoint require the user permission \`${PERMISSIONS.VIEW_STUDENT}\``,
      tags: ['ComissionOffices'],
      headers: {
        type: 'object',
        properties: {
          authorization: { type: 'string', description: 'A JWT token with scope `user`' }
        },
        required: ['authorization']
      } as const satisfies JSONSchema,
      querystring: comissionOfficesQuerySchema,
      response: {
        200: {
          type: 'object',
          properties: {
            total: { type: 'integer' },
            records: {
              type: 'array',
              items: comissionOfficeResponseSchema
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
        cycleId,
        studentId,
        vacancyId,
        status,
        includeCycle,
        includeStudent,
        includeVacancy
      } = request.query

      const result = await services.comissionOfficeService().findAndCount({
        limit,
        offset,
        order: orderQueryToOrder(order) ?? undefined,
        cycleId,
        studentId,
        vacancyId,
        status,
        includeCycle,
        includeStudent,
        includeVacancy
      })

      const records = result.records.map(record => ({
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
          : undefined,
        student: record.student !== undefined
          ? {
              ...record.student,
              createdAt: record.student.createdAt.toISOString(),
              updatedAt: record.student.updatedAt.toISOString()
            }
          : undefined,
        vacancy: record.vacancy !== undefined
          ? {
              ...record.vacancy,
              createdAt: record.vacancy.createdAt.toISOString(),
              updatedAt: record.vacancy.updatedAt.toISOString()
            }
          : undefined
      }))

      await reply.status(200).send({
        total: result.total,
        records
      })
    }
  })
}

export default routesPlugin
