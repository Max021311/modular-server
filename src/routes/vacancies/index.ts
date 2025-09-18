import { JsonSchemaToTsProvider } from '@fastify/type-provider-json-schema-to-ts'
import { JSONSchema } from 'json-schema-to-ts'
import { FastifyPluginAsync } from 'fastify'
import { orderQueryToOrder } from '#src/common/order-query.js'
import buildVerifyUserToken from '#src/prehandlers/verify-user-token.js'
import { PERMISSIONS } from '#src/common/permissions.js'
import { HttpError } from '#src/common/error.js'
import { DatabaseError } from 'pg'

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
      disabled: { type: 'boolean' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' }
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
      includeCycle: { type: 'boolean', default: false },
      includeDepartment: { type: 'boolean', default: false },
      departmentId: { type: 'integer' },
      cycleId: { type: 'integer' }
    }
  } as const satisfies JSONSchema

  const studentWithCareerResponseSchema = {
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
    required: ['id', 'name', 'code', 'careerId', 'email', 'telephone', 'createdAt', 'updatedAt', 'career']
  } as const satisfies JSONSchema

  const vacancyByIdQuerySchema = {
    type: 'object',
    properties: {
      includeCycle: { type: 'boolean', default: false },
      includeDepartment: { type: 'boolean', default: false }
    }
  } as const satisfies JSONSchema

  const createVacancySchema = {
    type: 'object',
    properties: {
      name: { type: 'string' },
      description: { type: 'string' },
      slots: { type: 'integer' },
      cycleId: { type: 'integer' },
      departmentId: { type: 'integer' },
      disabled: { type: 'boolean', default: false }
    },
    required: ['name', 'description', 'slots', 'cycleId', 'departmentId', 'disabled']
  } as const satisfies JSONSchema

  server.route({
    method: 'GET',
    url: '/',
    schema: {
      description: `Endpoint to get vacancies with pagination. This endpoint require the user permission \`${PERMISSIONS.VIEW_VACANCY}\``,
      tags: ['Vacancies'],
      headers: {
        type: 'object',
        properties: {
          authorization: { type: 'string', description: 'A JWT token with scope `user`' }
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
        } as const satisfies JSONSchema
      }
    },
    preHandler: buildVerifyUserToken([PERMISSIONS.VIEW_VACANCY]),
    async handler (request, reply) {
      const services = request.server.services
      const {
        limit = 50,
        offset = 0,
        order,
        search,
        includeCycle = false,
        includeDepartment = false,
        departmentId,
        cycleId
      } = request.query

      const result = await services.vacancyService().findAndCount({
        limit,
        offset,
        order: orderQueryToOrder(order) ?? undefined,
        search,
        includeCycle,
        includeDepartment,
        departmentId,
        cycleId
      })

      const records = result.records.map(record => ({
        ...record,
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString(),
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
    url: '/',
    schema: {
      description: `Endpoint to create a new vacancy. This endpoint require the user permission \`${PERMISSIONS.EDIT_VACANCY}\``,
      tags: ['Vacancies'],
      headers: {
        type: 'object',
        properties: {
          authorization: { type: 'string', description: 'A JWT token with scope `user`' }
        },
        required: ['authorization']
      } as const satisfies JSONSchema,
      body: createVacancySchema,
      response: {
        201: vacancyResponseSchema
      }
    },
    preHandler: buildVerifyUserToken([PERMISSIONS.EDIT_VACANCY]),
    async handler (request, reply) {
      const services = request.server.services
      const vacancy = request.body

      const cycle = await services.cycleService().findById(vacancy.cycleId)
      if (cycle === null) throw new HttpError('Conflict: cycle doesn\'t found', 409)
      const department = await services.departmentService().findById(vacancy.departmentId)
      if (department === null) throw new HttpError('Conflict: department doesn\'t found', 409)

      try {
        const createdVacancy = await services.vacancyService().create(vacancy)

        const response = {
          ...createdVacancy,
          createdAt: createdVacancy.createdAt.toISOString(),
          updatedAt: createdVacancy.updatedAt.toISOString()
        }

        await reply.status(201).send(response)
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
    url: '/:id',
    schema: {
      description: `Endpoint to get a vacancy by ID. This endpoint require the user permission \`${PERMISSIONS.VIEW_VACANCY}\``,
      tags: ['Vacancies'],
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
      querystring: vacancyByIdQuerySchema,
      response: {
        200: vacancyResponseSchema,
        404: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        } as const satisfies JSONSchema
      }
    },
    preHandler: buildVerifyUserToken([PERMISSIONS.VIEW_VACANCY]),
    async handler (request, reply) {
      const services = request.server.services
      const { id } = request.params
      const { includeCycle = false, includeDepartment = false } = request.query

      const vacancy = await services.vacancyService().findById(id, {
        includeCycle,
        includeDepartment
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
    url: '/:id/students',
    schema: {
      description: `Endpoint to get all students associated to a vacancy. This endpoint require the user permission \`${PERMISSIONS.VIEW_VACANCY}\``,
      tags: ['Vacancies'],
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
        200: {
          type: 'array',
          items: studentWithCareerResponseSchema
        } as const satisfies JSONSchema
      }
    },
    preHandler: buildVerifyUserToken([PERMISSIONS.VIEW_VACANCY]),
    async handler (request, reply) {
      const services = request.server.services
      const { id } = request.params

      const students = await services.studentService().findStudentsByVacancyId(id)

      const records = students.map(student => {
        const career = student.career
        return {
          ...student,
          createdAt: student.createdAt.toISOString(),
          updatedAt: student.updatedAt.toISOString(),
          career: {
            ...career,
            createdAt: career.createdAt.toISOString(),
            updatedAt: career.updatedAt.toISOString()
          }
        }
      })

      await reply.status(200).send(records)
    }
  })
}

export default routesPlugin
