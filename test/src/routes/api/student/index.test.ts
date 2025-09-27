import { describe, beforeAll, afterAll, expect } from 'vitest'
import { isolatedIt as it } from '#test/utils/isolatedIt.js'
import build from '#src/build.js'
import { careerFactory } from '#test/utils/factories/career.js'
import { studentFactory } from '#test/utils/factories/student.js'
import { faker } from '@faker-js/faker'

describe('Student API', () => {
  const app = build()

  beforeAll(async () => {
    await app.ready()
  })
  
  afterAll(async () => {
    await app.close()
  })

  describe('POST /api/student/auth', () => {
    const PATH = '/api/student/auth'
    const METHOD = 'POST'
    
    it('Success login student with valid credentials', async () => {
      const career = await careerFactory.create()
      const password = faker.string.alphanumeric(10)
      const student = await studentFactory.create({
        careerId: career.id,
        password
      })

      const res = await app.inject({
        url: PATH,
        method: METHOD,
        payload: {
          email: student.email,
          password
        }
      })

      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body).toHaveProperty('token')
      expect(typeof body.token).toBe('string')
    })
  })
})
