import { describe, beforeAll, afterAll, expect } from 'vitest'
import { isolatedIt as it } from '#test/utils/isolatedIt'
import build from '#src/build'
import { userFactory } from '#test/utils/factories/user'
import { departmentFactory } from '#test/utils/factories/department'
import { faker } from '@faker-js/faker'
import configuration from '#src/common/configuration'
import { JwtService } from '#src/service/jwt'

describe('Departments API', () => {
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

  describe('GET /departments', () => {
    const PATH = '/departments'
    const METHOD = 'GET'

    it('Success get departments returns total count and records', async () => {
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
        departmentFactory.create(),
        departmentFactory.create(),
        departmentFactory.create(),
        departmentFactory.create(),
        departmentFactory.create(),
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
      expect(record).toHaveProperty('name')
      expect(record).toHaveProperty('address')
      expect(record).toHaveProperty('phone')
      expect(record).toHaveProperty('email')
      expect(record).toHaveProperty('chiefName')
      expect(record).toHaveProperty('createdAt')
      expect(record).toHaveProperty('updatedAt')
    })

    it('Success get departments with search query param', async () => {
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

      const [department] = await Promise.all([
        departmentFactory.create({ name: 'Secretaria de salud' }),
        departmentFactory.create({ name: 'Hacienda'}),
        departmentFactory.create({ name: 'Secretaria de cultura' }),
        departmentFactory.create({ name: 'Secretaria de movilidad' })
      ])

      const res = await app.inject({
        url: PATH,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        },
        query: {
          search: department.name,
        }
      })

      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body).toHaveProperty('total')
      expect(body).toHaveProperty('records')
      expect(body.total).toBe(1)
      expect(body.records).toBeInstanceOf(Array)

      const record = body.records[0]
      expect(record).toHaveProperty('id', department.id)
      expect(record).toHaveProperty('name', department.name)
      expect(record).toHaveProperty('address', department.address)
      expect(record).toHaveProperty('phone', department.phone)
      expect(record).toHaveProperty('email', department.email)
      expect(record).toHaveProperty('chiefName', department.chiefName)
      expect(record).toHaveProperty('createdAt')
      expect(record).toHaveProperty('updatedAt')
    })

    it('Success get departments with limit parameter', async () => {
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
        departmentFactory.create(),
        departmentFactory.create(),
        departmentFactory.create(),
        departmentFactory.create(),
        departmentFactory.create(),
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

    it('Success get departments with limit and offset parameters', async () => {
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
        departmentFactory.create(),
        departmentFactory.create(),
        departmentFactory.create(),
        departmentFactory.create(),
        departmentFactory.create(),
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

    it('Success get departments with order parameter', async () => {
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
        departmentFactory.create(),
        departmentFactory.create(),
        departmentFactory.create(),
      ])

      const res = await app.inject({
        url: PATH,
        method: METHOD,
        query: {
          order: 'Departments.id'
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

    it('Returns 403 when user lacks VIEW_DEPARTMENT permission', async () => {
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

  describe('GET /departments/:id', () => {
    const METHOD = 'GET'
    const PATH = '/departments/:id'
    
    it('Success get department by id', async () => {
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

      const department = await departmentFactory.create()

      const res = await app.inject({
        url: PATH.replace(':id', department.id.toString()),
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        }
      })
      
      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body).toHaveProperty('id', department.id)
      expect(body).toHaveProperty('name', department.name)
      expect(body).toHaveProperty('address', department.address)
      expect(body).toHaveProperty('phone', department.phone)
      expect(body).toHaveProperty('email', department.email)
      expect(body).toHaveProperty('chiefName', department.chiefName)
      expect(body).toHaveProperty('createdAt')
      expect(body).toHaveProperty('updatedAt')
    })

    it('Returns 404 when department not found', async () => {
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

      const nonExistentId = 99999

      const res = await app.inject({
        url: PATH.replace(':id', nonExistentId.toString()),
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        }
      })
      
      expect(res.statusCode).toBe(404)
      const body = res.json()
      expect(body).toHaveProperty('message', 'Department not found')
    })

    it('Returns 400 when no authorization token provided', async () => {
      const department = await departmentFactory.create()

      const res = await app.inject({
        url: PATH.replace(':id', department.id.toString()),
        method: METHOD
      })
      
      expect(res.statusCode).toBe(400)
      const body = res.json()
      expect(body).toHaveProperty('message', 'headers must have required property \'authorization\'')
    })

    it('Returns 403 when user lacks VIEW_DEPARTMENT permission', async () => {
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

      const department = await departmentFactory.create()

      const res = await app.inject({
        url: PATH.replace(':id', department.id.toString()),
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        }
      })
      
      expect(res.statusCode).toBe(403)
    })

    it('Returns 400 when id parameter is not a number', async () => {
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

      const res = await app.inject({
        url: PATH.replace(':id', 'invalid'),
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        }
      })
      
      expect(res.statusCode).toBe(400)
    })
  })

  describe('POST /departments', () => {
    const METHOD = 'POST'
    const PATH = '/departments'
    
    it('Success create department', async () => {
      const password = faker.string.alphanumeric(10)
      const user = await userFactory.create({
        password,
        role: 'admin' // Admin has EDIT_DEPARTMENT permission
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

      const departmentData = {
        name: faker.company.name(),
        address: faker.location.streetAddress(),
        phone: faker.phone.number(),
        email: faker.internet.email(),
        chiefName: faker.person.fullName()
      }

      const res = await app.inject({
        url: PATH,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        },
        payload: departmentData
      })
      
      expect(res.statusCode).toBe(201)
      const body = res.json()
      expect(body).toHaveProperty('id')
      expect(body).toHaveProperty('name', departmentData.name)
      expect(body).toHaveProperty('address', departmentData.address)
      expect(body).toHaveProperty('phone', departmentData.phone)
      expect(body).toHaveProperty('email', departmentData.email)
      expect(body).toHaveProperty('chiefName', departmentData.chiefName)
      expect(body).toHaveProperty('createdAt')
      expect(body).toHaveProperty('updatedAt')
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
        name: faker.company.name()
        // Missing required fields: address, phone, email, chiefName
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

    it('Returns 400 when email format is invalid', async () => {
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

      const invalidEmailData = {
        name: faker.company.name(),
        address: faker.location.streetAddress(),
        phone: faker.phone.number(),
        email: 'invalid-email',
        chiefName: faker.person.fullName()
      }

      const res = await app.inject({
        url: PATH,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        },
        payload: invalidEmailData
      })
      
      expect(res.statusCode).toBe(400)
    })

    it('Returns 400 when no authorization token provided', async () => {
      const departmentData = {
        name: faker.company.name(),
        address: faker.location.streetAddress(),
        phone: faker.phone.number(),
        email: faker.internet.email(),
        chiefName: faker.person.fullName()
      }

      const res = await app.inject({
        url: PATH,
        method: METHOD,
        payload: departmentData
      })
      
      expect(res.statusCode).toBe(400)
      const body = res.json()
      expect(body).toHaveProperty('message', 'headers must have required property \'authorization\'')
    })

    it('Returns 403 when user lacks EDIT_DEPARTMENT permission', async () => {
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

      const departmentData = {
        name: faker.company.name(),
        address: faker.location.streetAddress(),
        phone: faker.phone.number(),
        email: faker.internet.email(),
        chiefName: faker.person.fullName()
      }

      const res = await app.inject({
        url: PATH,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        },
        payload: departmentData
      })
      
      expect(res.statusCode).toBe(403)
    })
  })

  describe('PATCH /departments/:id', () => {
    const METHOD = 'PATCH'
    const PATH = '/departments/:id'
    
    it('Success update department with all fields', async () => {
      const password = faker.string.alphanumeric(10)
      const user = await userFactory.create({
        password,
        role: 'admin' // Admin has EDIT_DEPARTMENT permission
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

      const department = await departmentFactory.create()
      
      const updateData = {
        name: faker.company.name(),
        address: faker.location.streetAddress(),
        phone: faker.phone.number(),
        email: faker.internet.email(),
        chiefName: faker.person.fullName()
      }

      const res = await app.inject({
        url: PATH.replace(':id', department.id.toString()),
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        },
        payload: updateData
      })
      
      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body).toHaveProperty('id', department.id)
      expect(body).toHaveProperty('name', updateData.name)
      expect(body).toHaveProperty('address', updateData.address)
      expect(body).toHaveProperty('phone', updateData.phone)
      expect(body).toHaveProperty('email', updateData.email)
      expect(body).toHaveProperty('chiefName', updateData.chiefName)
      expect(body).toHaveProperty('createdAt')
      expect(body).toHaveProperty('updatedAt')
      
      // Verify updatedAt is different from original
      expect(new Date(body.updatedAt).getTime()).toBeGreaterThan(department.updatedAt.getTime())
    })

    it('Success update department with partial fields', async () => {
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

      const department = await departmentFactory.create()
      
      const updateData = {
        name: faker.company.name(),
        email: faker.internet.email()
        // Only updating name and email
      }

      const res = await app.inject({
        url: PATH.replace(':id', department.id.toString()),
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        },
        payload: updateData
      })
      
      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body).toHaveProperty('id', department.id)
      expect(body).toHaveProperty('name', updateData.name)
      expect(body).toHaveProperty('address', department.address) // Unchanged
      expect(body).toHaveProperty('phone', department.phone) // Unchanged
      expect(body).toHaveProperty('email', updateData.email)
      expect(body).toHaveProperty('chiefName', department.chiefName) // Unchanged
    })

    it('Returns 404 when department not found', async () => {
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
        name: faker.company.name()
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
      expect(body).toHaveProperty('message', 'Department not found')
    })

    it('Returns 400 when email format is invalid', async () => {
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

      const department = await departmentFactory.create()
      
      const invalidUpdateData = {
        email: 'invalid-email'
      }

      const res = await app.inject({
        url: PATH.replace(':id', department.id.toString()),
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        },
        payload: invalidUpdateData
      })
      
      expect(res.statusCode).toBe(400)
    })

    it('Returns 400 when no authorization token provided', async () => {
      const department = await departmentFactory.create()
      
      const updateData = {
        name: faker.company.name()
      }

      const res = await app.inject({
        url: PATH.replace(':id', department.id.toString()),
        method: METHOD,
        payload: updateData
      })
      
      expect(res.statusCode).toBe(400)
      const body = res.json()
      expect(body).toHaveProperty('message', 'headers must have required property \'authorization\'')
    })

    it('Returns 403 when user lacks EDIT_DEPARTMENT permission', async () => {
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

      const department = await departmentFactory.create()
      
      const updateData = {
        name: faker.company.name()
      }

      const res = await app.inject({
        url: PATH.replace(':id', department.id.toString()),
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
        name: faker.company.name()
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
