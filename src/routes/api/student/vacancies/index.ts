import { FastifyPluginAsync } from 'fastify'
import { JsonSchemaToTsProvider } from '@fastify/type-provider-json-schema-to-ts'
import { JSONSchema } from 'json-schema-to-ts'
import { fastifyErrorSchema } from '#src/common/schemas.js'
import { orderQueryToOrder } from '#src/common/order-query.js'
import verifyStudentToken from '#src/prehandlers/verify-student-token.js'
import { HttpError } from '#src/common/error.js'

const routesPlugin: FastifyPluginAsync = async function routesPlugin (fastify) {
  const server = fastify.withTypeProvider<JsonSchemaToTsProvider>()

  const vacancyResponseSchema = {
    type: 'object',
    properties: {
      id: { type: 'integer' },
      name: { type: 'string' },
      description: { type: 'string' },
      slots: { type: 'integer' },
      cycleId: { type: 'integer' },
      cycle: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          slug: { type: 'string' },
          isCurrent: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        },
        required: ['id', 'slug', 'isCurrent', 'createdAt', 'updatedAt']
      },
      departmentId: { type: 'integer' },
      department: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          address: { type: 'string' },
          phone: { type: 'string' },
          email: { type: 'string' },
          chiefName: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        },
        required: ['id', 'name', 'address', 'phone', 'email', 'chiefName', 'createdAt', 'updatedAt']
      },
      usedSlots: { type: 'integer' },
      disabled: { type: 'boolean' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
      deletedAt: { type: 'string', format: 'date-time', nullable: true }
    },
    required: ['id', 'name', 'description', 'slots', 'cycleId', 'departmentId', 'disabled', 'createdAt', 'updatedAt']
  } as const satisfies JSONSchema

  const vacanciesQuerySchema = {
    type: 'object',
    properties: {
      order: {
        type: 'string',
        enum: ['Vacancies.createdAt', '-Vacancies.createdAt', 'Vacancies.id', '-Vacancies.id', 'Vacancies.name', '-Vacancies.name'],
        description: "Order by the field name. A minus(-) means that we'll order the file collections in descending order.",
        default: '-Vacancies.createdAt'
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
      search: { type: 'string' },
      includeCycle: { type: 'boolean', default: true },
      includeDepartment: { type: 'boolean', default: true },
      includeUsedSlots: { type: 'boolean', default: false }
    }
  } as const satisfies JSONSchema

  const vacancyByIdQuerySchema = {
    type: 'object',
    properties: {
      includeCycle: { type: 'boolean', default: true },
      includeDepartment: { type: 'boolean', default: true },
      includeUsedSlots: { type: 'boolean', default: false }
    }
  } as const satisfies JSONSchema

  server.route({
    method: 'GET',
    url: '/',
    schema: {
      description: 'Get vacancies for the current cycle with pagination, search and ordering',
      tags: ['Student Vacancies'],
      headers: {
        type: 'object',
        properties: {
          authorization: { type: 'string', description: 'A JWT token with scope `student`' }
        },
        required: ['authorization']
      } as const satisfies JSONSchema,
      querystring: vacanciesQuerySchema,
      response: {
        200: {
          type: 'object',
          properties: {
            total: { type: 'integer' },
            records: {
              type: 'array',
              items: vacancyResponseSchema
            }
          }
        } as const satisfies JSONSchema,
        404: fastifyErrorSchema
      }
    },
    preHandler: verifyStudentToken,
    async handler (request, reply) {
      const services = request.server.services
      const {
        limit = 50,
        offset = 0,
        order,
        search,
        includeCycle = true,
        includeDepartment = true,
        includeUsedSlots = false
      } = request.query

      const currentCycle = await services.cycleService().findCurrent()

      if (!currentCycle) {
        await reply.status(404).send({ message: 'No current cycle found' })
        return
      }

      const result = await services.vacancyService().findAndCount({
        limit,
        offset,
        order: orderQueryToOrder(order) ?? undefined,
        search,
        includeCycle,
        includeDepartment,
        includeUsedSlots,
        cycleId: currentCycle.id
      })

      const records = result.records.map(record => ({
        ...record,
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString(),
        deletedAt: record.deletedAt === null ? null : record.deletedAt.toISOString(),
        cycle: record.cycle
          ? {
              ...record.cycle,
              createdAt: record.cycle.createdAt.toISOString(),
              updatedAt: record.cycle.updatedAt.toISOString()
            }
          : undefined,
        department: record.department
          ? {
              ...record.department,
              createdAt: record.department.createdAt.toISOString(),
              updatedAt: record.department.updatedAt.toISOString()
            }
          : undefined
      }))

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
      description: 'Get a vacancy by ID for students',
      tags: ['Student Vacancies'],
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
          id: { type: 'integer' }
        },
        required: ['id']
      } as const satisfies JSONSchema,
      querystring: vacancyByIdQuerySchema,
      response: {
        200: vacancyResponseSchema,
        404: fastifyErrorSchema
      }
    },
    preHandler: verifyStudentToken,
    async handler (request, reply) {
      const services = request.server.services
      const { id } = request.params
      const { includeCycle = true, includeDepartment = true, includeUsedSlots = false } = request.query

      const vacancy = await services.vacancyService().findById(id, {
        includeCycle,
        includeDepartment,
        includeUsedSlots
      })

      if (!vacancy) {
        await reply.status(404).send({
          message: 'Vacancy not found'
        })
        return
      }

      const response = {
        ...vacancy,
        createdAt: vacancy.createdAt.toISOString(),
        updatedAt: vacancy.updatedAt.toISOString(),
        deletedAt: vacancy.deletedAt === null ? null : vacancy.deletedAt.toISOString(),
        cycle: vacancy.cycle
          ? {
              ...vacancy.cycle,
              createdAt: vacancy.cycle.createdAt.toISOString(),
              updatedAt: vacancy.cycle.updatedAt.toISOString()
            }
          : undefined,
        department: vacancy.department
          ? {
              ...vacancy.department,
              createdAt: vacancy.department.createdAt.toISOString(),
              updatedAt: vacancy.department.updatedAt.toISOString()
            }
          : undefined
      }

      await reply.status(200).send(response)
    }
  })

  server.route({
    method: 'GET',
    url: '/associated',
    schema: {
      description: 'Get vacancies associated to the current student with pagination, search and ordering',
      tags: ['Student Vacancies'],
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
          order: {
            type: 'string',
            enum: ['Vacancies.createdAt', '-Vacancies.createdAt', 'Vacancies.id', '-Vacancies.id', 'Vacancies.name', '-Vacancies.name'],
            description: "Order by the field name. A minus(-) means that we'll order the file collections in descending order.",
            default: '-Vacancies.createdAt'
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
          search: { type: 'string' },
          includeCycle: { type: 'boolean', default: true }
        }
      } as const satisfies JSONSchema,
      response: {
        200: {
          type: 'object',
          properties: {
            total: { type: 'integer' },
            records: {
              type: 'array',
              items: vacancyResponseSchema
            }
          }
        } as const satisfies JSONSchema
      }
    },
    preHandler: verifyStudentToken,
    async handler (request, reply) {
      const services = request.server.services
      const {
        limit = 50,
        offset = 0,
        order,
        search,
        includeCycle = true
      } = request.query
      const studentId = request.student.id

      const result = await services.vacancyService().findAndCount({
        limit,
        offset,
        order: orderQueryToOrder(order) ?? undefined,
        search,
        includeCycle,
        includeDepartment: false,
        includeUsedSlots: false,
        studentId
      })

      const records = result.records.map(record => ({
        ...record,
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString(),
        deletedAt: record.deletedAt === null ? null : record.deletedAt.toISOString(),
        cycle: record.cycle
          ? {
              ...record.cycle,
              createdAt: record.cycle.createdAt.toISOString(),
              updatedAt: record.cycle.updatedAt.toISOString()
            }
          : undefined,
        department: record.department
          ? {
              ...record.department,
              createdAt: record.department.createdAt.toISOString(),
              updatedAt: record.department.updatedAt.toISOString()
            }
          : undefined
      }))

      await reply.status(200).send({
        total: result.total,
        records
      })
    }
  })

  server.route({
    method: 'POST',
    url: '/:id/apply',
    schema: {
      description: 'Apply to a vacancy',
      tags: ['Student Vacancies'],
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
          id: { type: 'integer' }
        },
        required: ['id']
      } as const satisfies JSONSchema,
      response: {
        204: {},
        400: fastifyErrorSchema,
        404: fastifyErrorSchema,
        409: fastifyErrorSchema
      }
    },
    preHandler: verifyStudentToken,
    async handler (request, reply) {
      const services = request.server.services
      const { id: vacancyId } = request.params
      const studentId = request.student.id

      const vacancy = await services.vacancyService().findById(vacancyId)
      if (!vacancy) {
        throw new HttpError('Vacancy not found', 404)
      }

      if (vacancy.disabled) {
        throw new HttpError('Vacancy is not active', 400)
      }

      const currentCycle = await services.cycleService().findCurrent()
      if (!currentCycle) {
        throw new HttpError('No current cycle found', 404)
      }

      if (vacancy.cycleId !== currentCycle.id) {
        throw new HttpError('Vacancy is not for the current cycle', 400)
      }

      const validation = await services.vacancyService().validateAssociation(vacancyId, studentId, vacancy.cycleId)
      if (!validation.isValid) {
        const statusCode = validation.error === 'VACANCY_NO_SLOTS' ? 400 : 409
        throw new HttpError(validation.message!, statusCode)
      }

      await services.vacancyService().createAssociation(vacancyId, studentId)

      await reply.status(204).send()
    }
  })
}

export default routesPlugin
