import { JSONSchema } from 'json-schema-to-ts'

export const fastifyErrorSchema = {
  type: 'object',
  properties: {
    error: { type: 'string', description: 'The HTTP error message' },
    code: { type: 'string', description: 'Fastify error code' },
    message: { type: 'string', description: 'The error message' },
    statusCode: { type: 'integer', description: 'The HTTP status code', examples: ['404', '500'] }
  },
  additionalProperties: false
} as const satisfies JSONSchema
