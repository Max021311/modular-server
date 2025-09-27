import { JsonSchemaToTsProvider } from '@fastify/type-provider-json-schema-to-ts'
import { JSONSchema } from 'json-schema-to-ts'
import { FastifyPluginAsync } from 'fastify'
import { orderQueryToOrder } from '#src/common/order-query.js'
import { HttpError } from '#src/common/error.js'
import pg from 'pg'
const { DatabaseError } = pg

const routesPlugin: FastifyPluginAsync = async function routesPlugin (fastify) {
  const server = fastify.withTypeProvider<JsonSchemaToTsProvider>()

  const careerResponseSchema = {
    type: 'object',
    properties: {
      id: { type: 'integer' },
      name: { type: 'string' },
      slug: { type: 'string' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' }
    },
    required: ['id', 'name', 'slug', 'createdAt', 'updatedAt']
  } as const satisfies JSONSchema

  const createCareerSchema = {
    type: 'object',
    properties: {
      name: { type: 'string' },
      slug: { type: 'string' }
    },
    required: ['name', 'slug']
  } as const satisfies JSONSchema

  const updateCareerSchema = {
    type: 'object',
    properties: {
      name: { type: 'string' },
      slug: { type: 'string' }
    }
  } as const satisfies JSONSchema

  server.route({
    method: 'GET',
    url: '/',
    schema: {
      description: 'Get all careers',
      tags: ['Careers'],
      querystring: {
        type: 'object',
        properties: {
          search: { type: 'string' },
          order: {
            type: 'string',
            enum: ['Careers.createdAt', '-Careers.createdAt', 'Careers.id', '-Careers.id'],
            description: "Order by the field name. A minus(-) means that we'll order the file collections in descending order.",
            default: '-Careers.createdAt'
          }
        },
        additionalProperties: false
      } as const satisfies JSONSchema,
      response: {
        200: {
          type: 'array',
          items: careerResponseSchema
        } as const satisfies JSONSchema
      }
    },
    async handler (request, reply) {
      const services = request.server.services
      const careers = await services.careerService().findAll({
        search: request.query.search,
        order: orderQueryToOrder(request.query.order) ?? undefined
      })

      const records = careers.map(career => ({
        ...career,
        createdAt: career.createdAt.toISOString(),
        updatedAt: career.updatedAt.toISOString()
      }))

      await reply.status(200).send(records)
    }
  })

  server.route({
    method: 'POST',
    url: '/',
    schema: {
      description: 'Create a new career',
      tags: ['Careers'],
      body: createCareerSchema,
      response: {
        201: careerResponseSchema
      }
    },
    async handler (request, reply) {
      const services = request.server.services
      try {
        const career = await services.careerService().create(request.body)

        const record = {
          ...career,
          createdAt: career.createdAt.toISOString(),
          updatedAt: career.updatedAt.toISOString()
        }

        await reply.status(201).send(record)
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
      description: 'Update a career',
      tags: ['Careers'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'integer' }
        },
        required: ['id']
      } as const satisfies JSONSchema,
      body: updateCareerSchema,
      response: {
        200: careerResponseSchema,
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        } as const satisfies JSONSchema
      }
    },
    async handler (request, reply) {
      const services = request.server.services
      try {
        const career = await services.careerService().update(request.params.id, request.body)

        if (!career) {
          return reply.status(404).send({ error: 'Career not found' })
        }

        const record = {
          ...career,
          createdAt: career.createdAt.toISOString(),
          updatedAt: career.updatedAt.toISOString()
        }

        await reply.status(200).send(record)
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
