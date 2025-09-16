import { JsonSchemaToTsProvider } from '@fastify/type-provider-json-schema-to-ts'
import { JSONSchema } from 'json-schema-to-ts'
import { FastifyPluginAsync } from 'fastify'
import { orderQueryToOrder } from '#src/common/order-query'
import buildVerifyUserToken from '#src/prehandlers/verify-user-token'
import { PERMISSIONS } from '#src/common/permissions'
import { HttpError } from '#src/common/error'
import { fastifyErrorSchema } from '#src/common/schemas'

const routesPlugin: FastifyPluginAsync = async function routesPlugin (fastify) {
  const server = fastify.withTypeProvider<JsonSchemaToTsProvider>()

  const departmentResponseSchema = {
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
  } as const satisfies JSONSchema

  const createDepartmentBodySchema = {
    type: 'object',
    properties: {
      name: { type: 'string' },
      address: { type: 'string' },
      phone: { type: 'string' },
      email: { type: 'string', format: 'email' },
      chiefName: { type: 'string' }
    },
    required: ['name', 'address', 'phone', 'email', 'chiefName']
  } as const satisfies JSONSchema

  const updateDepartmentBodySchema = {
    type: 'object',
    properties: {
      name: { type: 'string' },
      address: { type: 'string' },
      phone: { type: 'string' },
      email: { type: 'string', format: 'email' },
      chiefName: { type: 'string' }
    },
    additionalProperties: false
  } as const satisfies JSONSchema

  const departmentsQuerySchema = {
    type: 'object',
    properties: {
      order: {
        type: 'string',
        enum: ['Departments.createdAt', '-Departments.createdAt', 'Departments.id', '-Departments.id'],
        description: "Order by the field name. A minus(-) means that we'll order the file collections in descending order.",
        default: '-Departments.createdAt'
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
      search: { type: 'string' }
    }
  } as const satisfies JSONSchema

  server.route({
    method: 'GET',
    url: '/',
    schema: {
      description: `Endpoint to get departments with pagination. This endpoint require the user permission \`${PERMISSIONS.VIEW_DEPARTMENT}\``,
      tags: ['Departments'],
      headers: {
        type: 'object',
        properties: {
          authorization: { type: 'string', description: 'A JWT token with scope `user`' }
        },
        required: ['authorization']
      } as const satisfies JSONSchema,
      querystring: departmentsQuerySchema,
      response: {
        200: {
          type: 'object',
          properties: {
            total: { type: 'integer' },
            records: {
              type: 'array',
              items: departmentResponseSchema
            }
          }
        } as const satisfies JSONSchema
      }
    },
    preHandler: buildVerifyUserToken([PERMISSIONS.VIEW_DEPARTMENT]),
    async handler (request, reply) {
      const services = request.server.services
      const {
        limit = 50,
        offset = 0,
        order,
        search
      } = request.query

      const result = await services.departmentService().findAndCountAll({
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

  server.route({
    method: 'GET',
    url: '/:id',
    schema: {
      description: `Endpoint to get a department by ID. This endpoint require the user permission \`${PERMISSIONS.VIEW_DEPARTMENT}\``,
      tags: ['Departments'],
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
        200: departmentResponseSchema,
        400: fastifyErrorSchema,
        404: fastifyErrorSchema
      }
    },
    preHandler: buildVerifyUserToken([PERMISSIONS.VIEW_DEPARTMENT]),
    async handler (request, reply) {
      const services = request.server.services
      const { id } = request.params

      const department = await services.departmentService().findById(id)

      if (!department) {
        throw new HttpError('Department not found', 404)
      }

      await reply.status(200).send({
        ...department,
        createdAt: department.createdAt.toISOString(),
        updatedAt: department.updatedAt.toISOString()
      })
    }
  })

  server.route({
    method: 'POST',
    url: '/',
    schema: {
      description: `Endpoint to create a new department. This endpoint require the user permission \`${PERMISSIONS.EDIT_DEPARTMENT}\``,
      tags: ['Departments'],
      headers: {
        type: 'object',
        properties: {
          authorization: { type: 'string', description: 'A JWT token with scope `user`' }
        },
        required: ['authorization']
      } as const satisfies JSONSchema,
      body: createDepartmentBodySchema,
      response: {
        201: departmentResponseSchema,
        400: fastifyErrorSchema
      }
    },
    preHandler: buildVerifyUserToken([PERMISSIONS.EDIT_DEPARTMENT]),
    async handler (request, reply) {
      const services = request.server.services
      const departmentData = request.body

      const department = await services.departmentService().create(departmentData)

      await reply.status(201).send({
        ...department,
        createdAt: department.createdAt.toISOString(),
        updatedAt: department.updatedAt.toISOString()
      })
    }
  })

  server.route({
    method: 'PATCH',
    url: '/:id',
    schema: {
      description: `Endpoint to update a department by ID. This endpoint require the user permission \`${PERMISSIONS.EDIT_DEPARTMENT}\``,
      tags: ['Departments'],
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
      body: updateDepartmentBodySchema,
      response: {
        200: departmentResponseSchema,
        400: fastifyErrorSchema,
        404: fastifyErrorSchema
      }
    },
    preHandler: buildVerifyUserToken([PERMISSIONS.EDIT_DEPARTMENT]),
    async handler (request, reply) {
      const services = request.server.services
      const { id } = request.params
      const departmentData = request.body

      // Check if department exists
      const existingDepartment = await services.departmentService().findById(id)
      if (!existingDepartment) {
        throw new HttpError('Department not found', 404)
      }

      const department = await services.departmentService().update(id, departmentData)

      await reply.status(200).send({
        ...department,
        createdAt: department.createdAt.toISOString(),
        updatedAt: department.updatedAt.toISOString()
      })
    }
  })
}

export default routesPlugin
