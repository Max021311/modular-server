import { JsonSchemaToTsProvider } from '@fastify/type-provider-json-schema-to-ts'
import { JSONSchema } from 'json-schema-to-ts'
import { FastifyPluginAsync } from 'fastify'
import { orderQueryToOrder } from '#src/common/order-query.js'
import buildVerifyUserToken from '#src/prehandlers/verify-user-token.js'
import { PERMISSIONS } from '#src/common/permissions.js'

const routesPlugin: FastifyPluginAsync = async function routesPlugin (fastify) {
  const server = fastify.withTypeProvider<JsonSchemaToTsProvider>()

  const finalReportResponseSchema = {
    type: 'object',
    properties: {
      id: { type: 'integer' },
      studentId: { type: 'integer' },
      vacancyId: { type: 'integer' },
      cycleId: { type: 'integer' },
      status: { type: 'string', enum: ['APPROVED', 'REJECTED', 'PENDING'] },
      hours: { type: 'integer' },
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
    required: ['id', 'studentId', 'vacancyId', 'cycleId', 'status', 'hours', 'fileId', 'createdAt', 'updatedAt']
  } as const satisfies JSONSchema

  const finalReportsQuerySchema = {
    type: 'object',
    properties: {
      order: {
        type: 'string',
        enum: ['FinalReports.createdAt', '-FinalReports.createdAt', 'FinalReports.id', '-FinalReports.id'],
        description: "Order by the field name. A minus(-) means that we'll order the file collections in descending order.",
        default: '-FinalReports.createdAt'
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
      description: `Endpoint to get final reports with pagination and filters. This endpoint require the user permission \`${PERMISSIONS.VIEW_STUDENT}\``,
      tags: ['FinalReports'],
      headers: {
        type: 'object',
        properties: {
          authorization: { type: 'string', description: 'A JWT token with scope `user`' }
        },
        required: ['authorization']
      } as const satisfies JSONSchema,
      querystring: finalReportsQuerySchema,
      response: {
        200: {
          type: 'object',
          properties: {
            total: { type: 'integer' },
            records: {
              type: 'array',
              items: finalReportResponseSchema
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

      const result = await services.finalReportService().findAndCount({
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

  const updateStatusBodySchema = {
    type: 'object',
    properties: {
      status: { type: 'string', enum: ['APPROVED', 'REJECTED'], description: 'New status for the final report' }
    },
    required: ['status']
  } as const satisfies JSONSchema

  const updateStatusResponseSchema = {
    type: 'object',
    properties: {
      id: { type: 'integer' },
      studentId: { type: 'integer' },
      vacancyId: { type: 'integer' },
      cycleId: { type: 'integer' },
      status: { type: 'string', enum: ['APPROVED', 'REJECTED', 'PENDING'] },
      hours: { type: 'integer' },
      fileId: { type: 'integer' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' }
    },
    required: ['id', 'studentId', 'vacancyId', 'cycleId', 'status', 'hours', 'fileId', 'createdAt', 'updatedAt']
  } as const satisfies JSONSchema

  server.route({
    method: 'PATCH',
    url: '/:id',
    schema: {
      description: `Endpoint to update the status of a final report. Only allows changing from PENDING to APPROVED or REJECTED. This endpoint requires the user permission \`${PERMISSIONS.EDIT_STUDENT}\``,
      tags: ['FinalReports'],
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
          id: { type: 'integer', description: 'FinalReport ID' }
        },
        required: ['id']
      } as const satisfies JSONSchema,
      body: updateStatusBodySchema,
      response: {
        200: updateStatusResponseSchema,
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
      const { status } = request.body

      // First, get the current record to check its current status
      const currentRecord = await services.finalReportService().getById(id)

      if (!currentRecord) {
        await reply.status(404).send({
          message: 'Final report not found'
        })
        return
      }

      // Validate that current status is PENDING
      if (currentRecord.status !== 'PENDING') {
        await reply.status(409).send({
          message: 'Cannot change status. Only PENDING status can be changed to APPROVED or REJECTED.'
        })
        return
      }

      // Update the status
      const updatedRecord = await services.finalReportService().update(id, { status })

      await reply.status(200).send({
        ...updatedRecord,
        createdAt: updatedRecord.createdAt.toISOString(),
        updatedAt: updatedRecord.updatedAt.toISOString()
      })
    }
  })
}

export default routesPlugin

