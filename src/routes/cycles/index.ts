import { JsonSchemaToTsProvider } from '@fastify/type-provider-json-schema-to-ts'
import { JSONSchema } from 'json-schema-to-ts'
import { FastifyPluginAsync } from 'fastify'
import { orderQueryToOrder } from '#src/common/order-query.js'
import buildVerifyUserToken from '#src/prehandlers/verify-user-token.js'
import { PERMISSIONS } from '#src/common/permissions.js'
import { HttpError } from '#src/common/error.js'
import { fastifyErrorSchema } from '#src/common/schemas.js'
import pg from 'pg'

const { DatabaseError } = pg

const routesPlugin: FastifyPluginAsync = async function routesPlugin (fastify) {
  const server = fastify.withTypeProvider<JsonSchemaToTsProvider>()

  const cycleResponseSchema = {
    type: 'object',
    properties: {
      id: { type: 'integer' },
      slug: { type: 'string' },
      isCurrent: { type: 'boolean' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' }
    },
    required: ['id', 'slug', 'isCurrent', 'createdAt', 'updatedAt']
  } as const satisfies JSONSchema

  const createCycleBodySchema = {
    type: 'object',
    properties: {
      slug: { type: 'string' },
      isCurrent: { type: 'boolean' }
    },
    required: ['slug', 'isCurrent']
  } as const satisfies JSONSchema

  const updateCycleBodySchema = {
    type: 'object',
    properties: {
      slug: { type: 'string' },
      isCurrent: { type: 'boolean' }
    },
    additionalProperties: false
  } as const satisfies JSONSchema

  const cyclesQuerySchema = {
    type: 'object',
    properties: {
      order: {
        type: 'string',
        enum: ['Cycles.createdAt', '-Cycles.createdAt', 'Cycles.id', '-Cycles.id'],
        description: "Order by the field name. A minus(-) means that we'll order the file collections in descending order.",
        default: '-Cycles.createdAt'
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
      description: `Endpoint to get cycles with pagination. This endpoint require the user permission \`${PERMISSIONS.VIEW_CYCLE}\``,
      tags: ['Cycles'],
      headers: {
        type: 'object',
        properties: {
          authorization: { type: 'string', description: 'A JWT token with scope `user`' }
        },
        required: ['authorization']
      } as const satisfies JSONSchema,
      querystring: cyclesQuerySchema,
      response: {
        200: {
          type: 'object',
          properties: {
            total: { type: 'integer' },
            records: {
              type: 'array',
              items: cycleResponseSchema
            }
          }
        } as const satisfies JSONSchema
      }
    },
    preHandler: buildVerifyUserToken([PERMISSIONS.VIEW_CYCLE]),
    async handler (request, reply) {
      const services = request.server.services
      const {
        limit = 50,
        offset = 0,
        order,
        search
      } = request.query

      const result = await services.cycleService().findAndCountAll({
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
    method: 'POST',
    url: '/',
    schema: {
      description: `Endpoint to create a new cycle. This endpoint require the user permission \`${PERMISSIONS.EDIT_CYCLE}\``,
      tags: ['Cycles'],
      headers: {
        type: 'object',
        properties: {
          authorization: { type: 'string', description: 'A JWT token with scope `user`' }
        },
        required: ['authorization']
      } as const satisfies JSONSchema,
      body: createCycleBodySchema,
      response: {
        201: cycleResponseSchema,
        400: fastifyErrorSchema,
        409: fastifyErrorSchema
      }
    },
    preHandler: buildVerifyUserToken([PERMISSIONS.EDIT_CYCLE]),
    async handler (request, reply) {
      const services = request.server.services
      const cycleData = request.body

      try {
        let cycle
        if (cycleData.isCurrent) {
          // If setting as current, use setCurrent which handles the transaction
          // First create the cycle as non-current, then set it as current
          const newCycle = await services.cycleService().create({
            slug: cycleData.slug,
            isCurrent: false
          })
          cycle = await services.cycleService().setCurrent(newCycle.id)
        } else {
          // Just create a non-current cycle
          cycle = await services.cycleService().create(cycleData)
        }

        await reply.status(201).send({
          ...cycle,
          createdAt: cycle.createdAt.toISOString(),
          updatedAt: cycle.updatedAt.toISOString()
        })
      } catch (error) {
        if (error instanceof DatabaseError && error.code === '23505') {
          throw new HttpError('Conflict', 409)
        }
        throw error
      }
    }
  })

  server.route({
    method: 'PATCH',
    url: '/:id',
    schema: {
      description: `Endpoint to update a cycle by ID. This endpoint require the user permission \`${PERMISSIONS.EDIT_CYCLE}\``,
      tags: ['Cycles'],
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
      body: updateCycleBodySchema,
      response: {
        200: cycleResponseSchema,
        400: fastifyErrorSchema,
        404: fastifyErrorSchema,
        409: fastifyErrorSchema
      }
    },
    preHandler: buildVerifyUserToken([PERMISSIONS.EDIT_CYCLE]),
    async handler (request, reply) {
      const services = request.server.services
      const { id } = request.params
      const cycleData = request.body

      // Check if cycle exists
      const existingCycle = await services.cycleService().findById(id)
      if (!existingCycle) {
        throw new HttpError('Cycle not found', 404)
      }

      try {
        let cycle
        if (cycleData?.isCurrent) {
          // If setting as current, first update the cycle, then use setCurrent
          if (typeof cycleData?.slug === 'string') {
            await services.cycleService().update(id, { slug: cycleData.slug })
          }
          cycle = await services.cycleService().setCurrent(id)
        } else {
          // Regular update
          cycle = await services.cycleService().update(id, cycleData)
        }

        await reply.status(200).send({
          ...cycle,
          createdAt: cycle.createdAt.toISOString(),
          updatedAt: cycle.updatedAt.toISOString()
        })
      } catch (error) {
        if (error instanceof DatabaseError && error.code === '23505') {
          throw new HttpError('Conflict', 409)
        }
        throw error
      }
    }
  })
}

export default routesPlugin
