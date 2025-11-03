import { JsonSchemaToTsProvider } from '@fastify/type-provider-json-schema-to-ts'
import { JSONSchema } from 'json-schema-to-ts'
import { FastifyPluginAsync } from 'fastify'
import buildVerifyUserToken from '#src/prehandlers/verify-user-token.js'
import { PERMISSIONS } from '#src/common/permissions.js'
import { HttpError } from '#src/common/error.js'
import { fastifyErrorSchema } from '#src/common/schemas.js'
import pg from 'pg'

const { DatabaseError } = pg

const routesPlugin: FastifyPluginAsync = async function routesPlugin (fastify) {
  const server = fastify.withTypeProvider<JsonSchemaToTsProvider>()

  const categoryResponseSchema = {
    type: 'object',
    properties: {
      id: { type: 'integer' },
      name: { type: 'string' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' }
    },
    required: ['id', 'name', 'createdAt', 'updatedAt']
  } as const satisfies JSONSchema

  const createCategoryBodySchema = {
    type: 'object',
    properties: {
      name: { type: 'string' }
    },
    required: ['name']
  } as const satisfies JSONSchema

  const updateCategoryBodySchema = {
    type: 'object',
    properties: {
      name: { type: 'string' }
    },
    additionalProperties: false
  } as const satisfies JSONSchema

  server.route({
    method: 'GET',
    url: '/',
    schema: {
      description: `Endpoint to get all categories. This endpoint require the user permission \`${PERMISSIONS.VIEW_CATEGORY}\``,
      tags: ['Categories'],
      headers: {
        type: 'object',
        properties: {
          authorization: { type: 'string', description: 'A JWT token with scope `user`' }
        },
        required: ['authorization']
      } as const satisfies JSONSchema,
      response: {
        200: {
          type: 'array',
          items: categoryResponseSchema
        } as const satisfies JSONSchema
      }
    },
    preHandler: buildVerifyUserToken([PERMISSIONS.VIEW_CATEGORY]),
    async handler (request, reply) {
      const services = request.server.services

      const categories = await services.categoryService().findAll()

      const records = categories.map((category) => ({
        ...category,
        createdAt: category.createdAt.toISOString(),
        updatedAt: category.updatedAt.toISOString()
      }))

      await reply.status(200).send(records)
    }
  })

  server.route({
    method: 'POST',
    url: '/',
    schema: {
      description: `Endpoint to create a new category. This endpoint require the user permission \`${PERMISSIONS.EDIT_CATEGORY}\``,
      tags: ['Categories'],
      headers: {
        type: 'object',
        properties: {
          authorization: { type: 'string', description: 'A JWT token with scope `user`' }
        },
        required: ['authorization']
      } as const satisfies JSONSchema,
      body: createCategoryBodySchema,
      response: {
        201: categoryResponseSchema,
        400: fastifyErrorSchema,
        409: fastifyErrorSchema
      }
    },
    preHandler: buildVerifyUserToken([PERMISSIONS.EDIT_CATEGORY]),
    async handler (request, reply) {
      const services = request.server.services
      const categoryData = request.body

      try {
        const category = await services.categoryService().create(categoryData)

        await reply.status(201).send({
          ...category,
          createdAt: category.createdAt.toISOString(),
          updatedAt: category.updatedAt.toISOString()
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
      description: `Endpoint to update a category by ID. This endpoint require the user permission \`${PERMISSIONS.EDIT_CATEGORY}\``,
      tags: ['Categories'],
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
      body: updateCategoryBodySchema,
      response: {
        200: categoryResponseSchema,
        400: fastifyErrorSchema,
        404: fastifyErrorSchema,
        409: fastifyErrorSchema
      }
    },
    preHandler: buildVerifyUserToken([PERMISSIONS.EDIT_CATEGORY]),
    async handler (request, reply) {
      const services = request.server.services
      const { id } = request.params
      const categoryData = request.body

      // Check if category exists
      const existingCategory = await services.categoryService().get(id)
      if (!existingCategory) {
        throw new HttpError('Category not found', 404)
      }

      try {
        const category = await services.categoryService().update(id, categoryData)

        await reply.status(200).send({
          ...category,
          createdAt: category.createdAt.toISOString(),
          updatedAt: category.updatedAt.toISOString()
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
