import { describe, beforeAll, afterAll, expect } from 'vitest'
import { isolatedIt as it } from '#test/utils/isolatedIt'
import build from '#src/build'
import { userFactory } from '#test/utils/factories/user'
import { faker } from '@faker-js/faker'

describe('Users API', () => {
  const app = build()

  beforeAll(async () => {
    await app.ready()
  })
  
  afterAll(async () => {
    await app.close()
  })

  describe('POST /user/auth', () => {
    const PATH = '/user/auth'
    const METHOD = 'POST'
    it('Success login', async () => {
      const password = faker.string.alphanumeric(10)
      const user = await userFactory.create({
        password
      })
      const res = await app.inject({
        url: PATH,
        method: METHOD,
        payload: {
          user: user.user,
          password: password
        }
      })
      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body).toHaveProperty('token')
    })
  })
})

