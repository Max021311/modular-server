import { describe, beforeAll, afterAll, expect } from 'vitest'
import { isolatedIt as it } from '#test/utils/isolatedIt'
import build from '#src/build'
import { userFactory } from '#test/utils/factories/user'
import { cycleFactory } from '#test/utils/factories/cycle'
import { faker } from '@faker-js/faker'
import configuration from '#src/common/configuration'
import { JwtService } from '#src/service/jwt'

describe('Cycles API', () => {
  const app = build()

  const jwtService = new JwtService({
    context: { logger: app.log },
    config: {
      secret: configuration.jwtService.secret
    }
  })

  beforeAll(async () => {
    await app.ready()
  })
  
  afterAll(async () => {
    await app.close()
  })

  describe('GET /cycles', () => {
    const PATH = '/cycles'
    const METHOD = 'GET'

    it('Success get cycles returns total count and records', async () => {
      const password = faker.string.alphanumeric(10)
      const user = await userFactory.create({
        password
      })
      
      const token = await jwtService.sign({
        id: user.id,
        name: user.name,
        user: user.user,
        role: user.role,
        permissions: user.permissions,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        scope: 'user'
      })

      await Promise.all([
        cycleFactory.create({
          slug: '2024A'
        }),
        cycleFactory.create({
          slug: '2024B'
        }),
        cycleFactory.create({
          slug: '2025A'
        }),
        cycleFactory.create({
          slug: '2025B'
        }),
        cycleFactory.create({
          slug: '2026A'
        }),
      ])

      const res = await app.inject({
        url: PATH,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        }
      })
      
      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body).toHaveProperty('total')
      expect(body).toHaveProperty('records')
      expect(body.total).toBe(5)
      expect(body.records).toBeInstanceOf(Array)

      const record = body.records[0]
      expect(record).toHaveProperty('id')
      expect(record).toHaveProperty('slug')
      expect(record).toHaveProperty('isCurrent')
      expect(record).toHaveProperty('createdAt')
      expect(record).toHaveProperty('updatedAt')
    })

    it('Success get cycles with search query param', async () => {
      const password = faker.string.alphanumeric(10)
      const user = await userFactory.create({
        password
      })
      
      const token = await jwtService.sign({
        id: user.id,
        name: user.name,
        user: user.user,
        role: user.role,
        permissions: user.permissions,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        scope: 'user'
      })

      const [cycle] = await Promise.all([
        cycleFactory.create({ slug: '2024A' }),
        cycleFactory.create({ slug: '2024B' }),
        cycleFactory.create({ slug: '2023A' }),
        cycleFactory.create({ slug: '2023B' })
      ])

      const res = await app.inject({
        url: PATH,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        },
        query: {
          search: cycle.slug,
        }
      })

      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body).toHaveProperty('total')
      expect(body).toHaveProperty('records')
      expect(body.total).toBe(1)
      expect(body.records).toBeInstanceOf(Array)

      const record = body.records[0]
      expect(record).toHaveProperty('id', cycle.id)
      expect(record).toHaveProperty('slug', cycle.slug)
      expect(record).toHaveProperty('isCurrent', cycle.isCurrent)
      expect(record).toHaveProperty('createdAt')
      expect(record).toHaveProperty('updatedAt')
    })

    it('Success get cycles with limit parameter', async () => {
      const password = faker.string.alphanumeric(10)
      const user = await userFactory.create({
        password
      })
      
      const token = await jwtService.sign({
        id: user.id,
        name: user.name,
        user: user.user,
        role: user.role,
        permissions: user.permissions,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        scope: 'user'
      })

      await Promise.all([
        cycleFactory.create({ slug: '2024A' }),
        cycleFactory.create({ slug: '2024B' }),
        cycleFactory.create({ slug: '2023A' }),
        cycleFactory.create({ slug: '2023B' }),
        cycleFactory.create({ slug: '2022B' })
      ])

      const res = await app.inject({
        url: PATH,
        method: METHOD,
        query: {
          limit: '3'
        },
        headers: {
          authorization: `Bearer ${token}`
        }
      })
      
      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.records.length).toBe(3)
      expect(body.total).toBe(5)
    })

    it('Success get cycles with limit and offset parameters', async () => {
      const password = faker.string.alphanumeric(10)
      const user = await userFactory.create({
        password
      })
      
      const token = await jwtService.sign({
        id: user.id,
        name: user.name,
        user: user.user,
        role: user.role,
        permissions: user.permissions,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        scope: 'user'
      })

      await Promise.all([
        cycleFactory.create({ slug: '2024A' }),
        cycleFactory.create({ slug: '2024B' }),
        cycleFactory.create({ slug: '2023A' }),
        cycleFactory.create({ slug: '2023B' }),
        cycleFactory.create({ slug: '2022B' })
      ])

      const res = await app.inject({
        url: PATH,
        method: METHOD,
        query: {
          limit: '2',
          offset: '2'
        },
        headers: {
          authorization: `Bearer ${token}`
        }
      })
      
      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.records.length).toBe(2)
      expect(body.total).toBe(5)
    })

    it('Success get cycles with order parameter', async () => {
      const password = faker.string.alphanumeric(10)
      const user = await userFactory.create({
        password
      })
      
      const token = await jwtService.sign({
        id: user.id,
        name: user.name,
        user: user.user,
        role: user.role,
        permissions: user.permissions,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        scope: 'user'
      })

      await Promise.all([
        cycleFactory.create({ slug: '2024A' }),
        cycleFactory.create({ slug: '2024B' }),
        cycleFactory.create({ slug: '2025A' }),
      ])

      const res = await app.inject({
        url: PATH,
        method: METHOD,
        query: {
          order: 'Cycles.id'
        },
        headers: {
          authorization: `Bearer ${token}`
        }
      })
      
      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.records.length).toBe(3)
      expect(body.total).toBe(3)
      
      // Check that records are ordered by id ascending
      const ids = body.records.map((r: any) => r.id)
      expect(ids).toEqual([...ids].sort((a, b) => a - b))
    })

    it('Returns 400 when no authorization token provided', async () => {
      const res = await app.inject({
        url: PATH,
        method: METHOD
      })
      
      expect(res.statusCode).toBe(400)
      const body = res.json()
      expect(body).toHaveProperty('message', 'headers must have required property \'authorization\'')
    })

    it('Returns 403 when user lacks VIEW_CYCLE permission', async () => {
      const password = faker.string.alphanumeric(10)
      const user = await userFactory.create({
        password,
        role: 'base',
        permissions: [] // No permissions
      })
      
      const token = await jwtService.sign({
        id: user.id,
        name: user.name,
        user: user.user,
        role: user.role,
        permissions: user.permissions,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        scope: 'user'
      })

      const res = await app.inject({
        url: PATH,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        }
      })
      
      expect(res.statusCode).toBe(403)
    })
  })

  describe('POST /cycles', () => {
    const PATH = '/cycles'
    const METHOD = 'POST'

    it('Success create cycle as non-current', async () => {
      const password = faker.string.alphanumeric(10)
      const user = await userFactory.create({
        password,
        role: 'admin' // Admin has EDIT_CYCLE permission
      })
      
      const token = await jwtService.sign({
        id: user.id,
        name: user.name,
        user: user.user,
        role: user.role,
        permissions: user.permissions,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        scope: 'user'
      })

      const cycleData = {
        slug: '2024A',
        isCurrent: false
      }

      const res = await app.inject({
        url: PATH,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        },
        payload: cycleData
      })
      
      expect(res.statusCode).toBe(201)
      const body = res.json()
      expect(body).toHaveProperty('id')
      expect(body).toHaveProperty('slug', cycleData.slug)
      expect(body).toHaveProperty('isCurrent', cycleData.isCurrent)
      expect(body).toHaveProperty('createdAt')
      expect(body).toHaveProperty('updatedAt')
    })

    it('Success create cycle as current when no current cycle exists', async () => {
      const password = faker.string.alphanumeric(10)
      const user = await userFactory.create({
        password,
        role: 'admin'
      })
      
      const token = await jwtService.sign({
        id: user.id,
        name: user.name,
        user: user.user,
        role: user.role,
        permissions: user.permissions,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        scope: 'user'
      })

      const cycleData = {
        slug: '2024A',
        isCurrent: true
      }

      const res = await app.inject({
        url: PATH,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        },
        payload: cycleData
      })
      
      expect(res.statusCode).toBe(201)
      const body = res.json()
      expect(body).toHaveProperty('id')
      expect(body).toHaveProperty('slug', cycleData.slug)
      expect(body).toHaveProperty('isCurrent', true)
      expect(body).toHaveProperty('createdAt')
      expect(body).toHaveProperty('updatedAt')
    })

    it('Success create cycle as current and deactivate existing current cycle', async () => {
      const password = faker.string.alphanumeric(10)
      const user = await userFactory.create({
        password,
        role: 'admin'
      })
      
      const token = await jwtService.sign({
        id: user.id,
        name: user.name,
        user: user.user,
        role: user.role,
        permissions: user.permissions,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        scope: 'user'
      })

      // Create an existing current cycle
      await cycleFactory.create({
        slug: '2023B',
        isCurrent: true
      })

      const cycleData = {
        slug: '2024A',
        isCurrent: true
      }

      const res = await app.inject({
        url: PATH,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        },
        payload: cycleData
      })
      
      expect(res.statusCode).toBe(201)
      const body = res.json()
      expect(body).toHaveProperty('id')
      expect(body).toHaveProperty('slug', cycleData.slug)
      expect(body).toHaveProperty('isCurrent', true)
      expect(body).toHaveProperty('createdAt')
      expect(body).toHaveProperty('updatedAt')

      // Verify that only one cycle is current
      const getCyclesRes = await app.inject({
        url: PATH,
        method: 'GET',
        headers: {
          authorization: `Bearer ${token}`
        }
      })
      
      const getCyclesBody = getCyclesRes.json()
      const currentCycles = getCyclesBody.records.filter((cycle: any) => cycle.isCurrent)
      expect(currentCycles).toHaveLength(1)
      expect(currentCycles[0].slug).toBe('2024A')
    })

    it('Returns 409 when cycle slug already exists', async () => {
      const password = faker.string.alphanumeric(10)
      const user = await userFactory.create({
        password,
        role: 'admin'
      })
      
      const token = await jwtService.sign({
        id: user.id,
        name: user.name,
        user: user.user,
        role: user.role,
        permissions: user.permissions,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        scope: 'user'
      })

      // Create an existing cycle
      await cycleFactory.create({
        slug: '2024A',
        isCurrent: false
      })

      const cycleData = {
        slug: '2024A', // Same slug
        isCurrent: false
      }

      const res = await app.inject({
        url: PATH,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        },
        payload: cycleData
      })
      
      expect(res.statusCode).toBe(409)
      const body = res.json()
      expect(body).toHaveProperty('message', 'Conflict')
    })

    it('Returns 400 when required fields are missing', async () => {
      const password = faker.string.alphanumeric(10)
      const user = await userFactory.create({
        password,
        role: 'admin'
      })
      
      const token = await jwtService.sign({
        id: user.id,
        name: user.name,
        user: user.user,
        role: user.role,
        permissions: user.permissions,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        scope: 'user'
      })

      const incompleteData = {
        slug: '2024A'
        // Missing required field: isCurrent
      }

      const res = await app.inject({
        url: PATH,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        },
        payload: incompleteData
      })
      
      expect(res.statusCode).toBe(400)
    })

    it('Returns 400 when no authorization token provided', async () => {
      const cycleData = {
        slug: '2024A',
        isCurrent: false
      }

      const res = await app.inject({
        url: PATH,
        method: METHOD,
        payload: cycleData
      })
      
      expect(res.statusCode).toBe(400)
      const body = res.json()
      expect(body).toHaveProperty('message', 'headers must have required property \'authorization\'')
    })

    it('Returns 403 when user lacks EDIT_CYCLE permission', async () => {
      const password = faker.string.alphanumeric(10)
      const user = await userFactory.create({
        password,
        role: 'base',
        permissions: [] // No permissions
      })
      
      const token = await jwtService.sign({
        id: user.id,
        name: user.name,
        user: user.user,
        role: user.role,
        permissions: user.permissions,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        scope: 'user'
      })

      const cycleData = {
        slug: '2024A',
        isCurrent: false
      }

      const res = await app.inject({
        url: PATH,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        },
        payload: cycleData
      })
      
      expect(res.statusCode).toBe(403)
    })
  })

  describe('PATCH /cycles/:id', () => {
    const METHOD = 'PATCH'
    const PATH = '/cycles/:id'

    it('Success update cycle slug only', async () => {
      const password = faker.string.alphanumeric(10)
      const user = await userFactory.create({
        password,
        role: 'admin' // Admin has EDIT_CYCLE permission
      })
      
      const token = await jwtService.sign({
        id: user.id,
        name: user.name,
        user: user.user,
        role: user.role,
        permissions: user.permissions,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        scope: 'user'
      })

      const cycle = await cycleFactory.create({
        slug: '2024A',
        isCurrent: false
      })

      const updateData = {
        slug: '2024B'
      }

      const res = await app.inject({
        url: PATH.replace(':id', cycle.id.toString()),
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        },
        payload: updateData
      })
      
      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body).toHaveProperty('id', cycle.id)
      expect(body).toHaveProperty('slug', updateData.slug)
      expect(body).toHaveProperty('isCurrent', false) // Should remain unchanged
      expect(body).toHaveProperty('createdAt')
      expect(body).toHaveProperty('updatedAt')
      
      // Verify updatedAt is different from original
      expect(new Date(body.updatedAt).getTime()).toBeGreaterThan(cycle.updatedAt.getTime())
    })

    it('Success update cycle to set as current', async () => {
      const password = faker.string.alphanumeric(10)
      const user = await userFactory.create({
        password,
        role: 'admin'
      })
      
      const token = await jwtService.sign({
        id: user.id,
        name: user.name,
        user: user.user,
        role: user.role,
        permissions: user.permissions,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        scope: 'user'
      })

      const cycle = await cycleFactory.create({
        slug: '2024A',
        isCurrent: false
      })

      const updateData = {
        isCurrent: true
      }

      const res = await app.inject({
        url: PATH.replace(':id', cycle.id.toString()),
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        },
        payload: updateData
      })
      
      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body).toHaveProperty('id', cycle.id)
      expect(body).toHaveProperty('slug', cycle.slug) // Should remain unchanged
      expect(body).toHaveProperty('isCurrent', true)
      expect(body).toHaveProperty('createdAt')
      expect(body).toHaveProperty('updatedAt')
    })

    it('Success update cycle to current and deactivate existing current cycle', async () => {
      const password = faker.string.alphanumeric(10)
      const user = await userFactory.create({
        password,
        role: 'admin'
      })
      
      const token = await jwtService.sign({
        id: user.id,
        name: user.name,
        user: user.user,
        role: user.role,
        permissions: user.permissions,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        scope: 'user'
      })

      // Create an existing current cycle
      await cycleFactory.create({
        slug: '2023B',
        isCurrent: true
      })

      // Create the cycle to update
      const cycle = await cycleFactory.create({
        slug: '2024A',
        isCurrent: false
      })

      const updateData = {
        isCurrent: true
      }

      const res = await app.inject({
        url: PATH.replace(':id', cycle.id.toString()),
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        },
        payload: updateData
      })
      
      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body).toHaveProperty('id', cycle.id)
      expect(body).toHaveProperty('slug', cycle.slug)
      expect(body).toHaveProperty('isCurrent', true)

      // Verify that only one cycle is current
      const getCyclesRes = await app.inject({
        url: '/cycles',
        method: 'GET',
        headers: {
          authorization: `Bearer ${token}`
        }
      })
      
      const getCyclesBody = getCyclesRes.json()
      const currentCycles = getCyclesBody.records.filter((c: any) => c.isCurrent)
      expect(currentCycles).toHaveLength(1)
      expect(currentCycles[0].id).toBe(cycle.id)
    })

    it('Success update both slug and current status', async () => {
      const password = faker.string.alphanumeric(10)
      const user = await userFactory.create({
        password,
        role: 'admin'
      })
      
      const token = await jwtService.sign({
        id: user.id,
        name: user.name,
        user: user.user,
        role: user.role,
        permissions: user.permissions,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        scope: 'user'
      })

      const cycle = await cycleFactory.create({
        slug: '2024A',
        isCurrent: false
      })

      const updateData = {
        slug: '2024B',
        isCurrent: true
      }

      const res = await app.inject({
        url: PATH.replace(':id', cycle.id.toString()),
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        },
        payload: updateData
      })
      
      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body).toHaveProperty('id', cycle.id)
      expect(body).toHaveProperty('slug', updateData.slug)
      expect(body).toHaveProperty('isCurrent', true)
      expect(body).toHaveProperty('createdAt')
      expect(body).toHaveProperty('updatedAt')
    })

    it('Success update cycle to set as non-current', async () => {
      const password = faker.string.alphanumeric(10)
      const user = await userFactory.create({
        password,
        role: 'admin'
      })
      
      const token = await jwtService.sign({
        id: user.id,
        name: user.name,
        user: user.user,
        role: user.role,
        permissions: user.permissions,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        scope: 'user'
      })

      const cycle = await cycleFactory.create({
        slug: '2024A',
        isCurrent: true
      })

      const updateData = {
        isCurrent: false
      }

      const res = await app.inject({
        url: PATH.replace(':id', cycle.id.toString()),
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        },
        payload: updateData
      })
      
      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body).toHaveProperty('id', cycle.id)
      expect(body).toHaveProperty('slug', cycle.slug)
      expect(body).toHaveProperty('isCurrent', false)
    })

    it('Returns 404 when cycle not found', async () => {
      const password = faker.string.alphanumeric(10)
      const user = await userFactory.create({
        password,
        role: 'admin'
      })
      
      const token = await jwtService.sign({
        id: user.id,
        name: user.name,
        user: user.user,
        role: user.role,
        permissions: user.permissions,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        scope: 'user'
      })

      const nonExistentId = 99999
      const updateData = {
        slug: '2024B'
      }

      const res = await app.inject({
        url: PATH.replace(':id', nonExistentId.toString()),
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        },
        payload: updateData
      })
      
      expect(res.statusCode).toBe(404)
      const body = res.json()
      expect(body).toHaveProperty('message', 'Cycle not found')
    })

    it('Returns 409 when updated slug conflicts with existing cycle', async () => {
      const password = faker.string.alphanumeric(10)
      const user = await userFactory.create({
        password,
        role: 'admin'
      })
      
      const token = await jwtService.sign({
        id: user.id,
        name: user.name,
        user: user.user,
        role: user.role,
        permissions: user.permissions,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        scope: 'user'
      })

      // Create two cycles
      await cycleFactory.create({
        slug: '2024A',
        isCurrent: false
      })

      const cycle = await cycleFactory.create({
        slug: '2024B',
        isCurrent: false
      })

      const updateData = {
        slug: '2024A' // Conflicts with existing cycle
      }

      const res = await app.inject({
        url: PATH.replace(':id', cycle.id.toString()),
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        },
        payload: updateData
      })
      
      expect(res.statusCode).toBe(409)
      const body = res.json()
      expect(body).toHaveProperty('message', 'Conflict')
    })

    it('Returns 400 when no authorization token provided', async () => {
      const cycle = await cycleFactory.create({
        slug: '2024A',
        isCurrent: false
      })

      const updateData = {
        slug: '2024B'
      }

      const res = await app.inject({
        url: PATH.replace(':id', cycle.id.toString()),
        method: METHOD,
        payload: updateData
      })
      
      expect(res.statusCode).toBe(400)
      const body = res.json()
      expect(body).toHaveProperty('message', 'headers must have required property \'authorization\'')
    })

    it('Returns 403 when user lacks EDIT_CYCLE permission', async () => {
      const password = faker.string.alphanumeric(10)
      const user = await userFactory.create({
        password,
        role: 'base',
        permissions: [] // No permissions
      })
      
      const token = await jwtService.sign({
        id: user.id,
        name: user.name,
        user: user.user,
        role: user.role,
        permissions: user.permissions,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        scope: 'user'
      })

      const cycle = await cycleFactory.create({
        slug: '2024A',
        isCurrent: false
      })

      const updateData = {
        slug: '2024B'
      }

      const res = await app.inject({
        url: PATH.replace(':id', cycle.id.toString()),
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        },
        payload: updateData
      })
      
      expect(res.statusCode).toBe(403)
    })

    it('Returns 400 when id parameter is not a number', async () => {
      const password = faker.string.alphanumeric(10)
      const user = await userFactory.create({
        password,
        role: 'admin'
      })
      
      const token = await jwtService.sign({
        id: user.id,
        name: user.name,
        user: user.user,
        role: user.role,
        permissions: user.permissions,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        scope: 'user'
      })

      const updateData = {
        slug: '2024B'
      }

      const res = await app.inject({
        url: PATH.replace(':id', 'invalid'),
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        },
        payload: updateData
      })
      
      expect(res.statusCode).toBe(400)
    })
  })
})
