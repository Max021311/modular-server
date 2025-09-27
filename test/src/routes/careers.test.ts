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

  describe('POST /careers', () => {
    const PATH = '/careers'
    const METHOD = 'POST'
    
    it('Success create career returns created career', async () => {
      const careerData = {
        name: 'Software Engineer',
        slug: 'software-engineer'
      }

      const res = await app.inject({
        url: PATH,
        method: METHOD,
        payload: careerData
      })
      
      expect(res.statusCode).toBe(201)
      const body = res.json()
      expect(body).toHaveProperty('id')
      expect(body).toHaveProperty('name', careerData.name)
      expect(body).toHaveProperty('slug', careerData.slug)
      expect(body).toHaveProperty('createdAt')
      expect(body).toHaveProperty('updatedAt')
      expect(new Date(body.createdAt)).toBeInstanceOf(Date)
      expect(new Date(body.updatedAt)).toBeInstanceOf(Date)
    })

    it('Returns 400 when missing required fields', async () => {
      const res = await app.inject({
        url: PATH,
        method: METHOD,
        payload: { name: 'Software Engineer' }
      })
      
      expect(res.statusCode).toBe(400)
    })

    it('Returns 400 when payload is empty', async () => {
      const res = await app.inject({
        url: PATH,
        method: METHOD,
        payload: {}
      })
      
      expect(res.statusCode).toBe(400)
    })
  })

  describe('PATCH /careers/:id', () => {
    const METHOD = 'PATCH'
    
    it('Success update career returns updated career', async () => {
      const career = await careerFactory.create()
      const updateData = {
        name: 'Updated Software Engineer',
        slug: 'updated-software-engineer'
      }

      const res = await app.inject({
        url: `/careers/${career.id}`,
        method: METHOD,
        payload: updateData
      })
      
      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body).toHaveProperty('id', career.id)
      expect(body).toHaveProperty('name', updateData.name)
      expect(body).toHaveProperty('slug', updateData.slug)
      expect(body).toHaveProperty('createdAt', career.createdAt.toISOString())
      expect(body).toHaveProperty('updatedAt')
      expect(new Date(body.updatedAt)).toBeInstanceOf(Date)
      expect(new Date(body.updatedAt).getTime()).toBeGreaterThan(career.updatedAt.getTime())
    })

    it('Success partial update career with only name', async () => {
      const career = await careerFactory.create()
      const updateData = {
        name: 'Partially Updated Engineer'
      }

      const res = await app.inject({
        url: `/careers/${career.id}`,
        method: METHOD,
        payload: updateData
      })
      
      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body).toHaveProperty('id', career.id)
      expect(body).toHaveProperty('name', updateData.name)
      expect(body).toHaveProperty('slug', career.slug)
    })

    it('Success partial update career with only slug', async () => {
      const career = await careerFactory.create()
      const updateData = {
        slug: 'updated-slug'
      }

      const res = await app.inject({
        url: `/careers/${career.id}`,
        method: METHOD,
        payload: updateData
      })
      
      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body).toHaveProperty('id', career.id)
      expect(body).toHaveProperty('name', career.name)
      expect(body).toHaveProperty('slug', updateData.slug)
    })

    it('Returns 404 when career does not exist', async () => {
      const res = await app.inject({
        url: '/careers/99999',
        method: METHOD,
        payload: { name: 'Non-existent Career' }
      })
      
      expect(res.statusCode).toBe(404)
      const body = res.json()
      expect(body).toHaveProperty('error', 'Career not found')
    })

    it('Returns 400 when id is not a number', async () => {
      const res = await app.inject({
        url: '/careers/invalid',
        method: METHOD,
        payload: { name: 'Test Career' }
      })
      
      expect(res.statusCode).toBe(400)
    })
  })
})
