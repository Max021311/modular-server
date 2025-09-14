import { describe, beforeAll, afterAll, expect } from 'vitest'
import { isolatedIt as it } from '#test/utils/isolatedIt'
import build from '#src/build'
import { careerFactory } from '#test/utils/factories/career'

describe('Careers API', () => {
  const app = build()

  beforeAll(async () => {
    await app.ready()
  })
  
  afterAll(async () => {
    await app.close()
  })

  describe('GET /careers', () => {
    const PATH = '/careers'
    const METHOD = 'GET'
    
    it('Success get all careers returns array of careers', async () => {
      const careers = await Promise.all([
        careerFactory.create(),
        careerFactory.create(),
        careerFactory.create()
      ])

      const res = await app.inject({
        url: PATH,
        method: METHOD
      })
      
      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body).toBeInstanceOf(Array)
      expect(body.length).toBe(3)

      const career = body.find((c: any) => c.id === careers[0].id)
       expect(career).toBeDefined()
      expect(career).toHaveProperty('id', careers[0].id)
      expect(career).toHaveProperty('name', careers[0].name)
      expect(career).toHaveProperty('slug', careers[0].slug)
      expect(career).toHaveProperty('createdAt', careers[0].createdAt.toISOString())
      expect(career).toHaveProperty('updatedAt', careers[0].updatedAt.toISOString())
    })

   it('Returns empty array when no careers exist', async () => {
      const res = await app.inject({
        url: PATH,
        method: METHOD
      })
      
      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body).toBeInstanceOf(Array)
      expect(body.length).toBeGreaterThanOrEqual(0)
    })
  })
})
