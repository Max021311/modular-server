import { describe, beforeAll, afterAll, expect } from 'vitest'
import { isolatedIt as it } from '#test/utils/isolatedIt'
import build from '#src/build'
import { userFactory } from '#test/utils/factories/user'
import { careerFactory } from '#test/utils/factories/career'
import { studentFactory } from '#test/utils/factories/student'
import { faker } from '@faker-js/faker'
import configuration from '#src/common/configuration'
import { JwtService } from '#src/service/jwt'

describe('Students API', () => {
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

  describe('POST /students/invite', () => {
    const PATH = '/students/invite'
    const METHOD = 'POST'
    it('Success invite', async () => {
      const password = faker.string.alphanumeric(10)
      const user = await userFactory.create({
        password
      })
      
      const token = await jwtService.sign({
        id: user.id,
        name: user.name,
        user: user.user,
        permissions: user.permissions,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        scope: 'user'
      })

      const email = faker.internet.email()
      const res = await app.inject({
        url: PATH,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        },
        payload: {
          email
        }
      })
      expect(res.statusCode).toBe(204)
    })
  })

  describe('POST /students/add', () => {
    const PATH = '/students/add'
    const METHOD = 'POST'
    it('Success add student', async () => {
      const career = await careerFactory.create()
      const email = faker.internet.email()
      
      const inviteToken = await jwtService.sign({
        email,
        scope: 'invite-user'
      })

      const studentData = {
        name: faker.person.fullName(),
        code: faker.string.alphanumeric(8).toUpperCase(),
        password: faker.string.alphanumeric(10),
        careerId: career.id,
        telephone: faker.phone.number()
      }

      const res = await app.inject({
        url: PATH,
        method: METHOD,
        headers: {
          authorization: `Bearer ${inviteToken}`
        },
        payload: studentData
      })
      expect(res.statusCode).toBe(201)
      const body = res.json()
      expect(body).toHaveProperty('id')
    })
  })

  describe('GET /students', () => {
    const PATH = '/students'
    const METHOD = 'GET'

    it('Success get students returns total count and records', async () => {
      const password = faker.string.alphanumeric(10)
      const user = await userFactory.create({
        password
      })
      
      const token = await jwtService.sign({
        id: user.id,
        name: user.name,
        user: user.user,
        permissions: user.permissions,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        scope: 'user'
      })

      const career = await careerFactory.create({})
      await Promise.all([
        studentFactory.create({ careerId: career.id }),
        studentFactory.create({ careerId: career.id }),
        studentFactory.create({ careerId: career.id }),
        studentFactory.create({ careerId: career.id }),
        studentFactory.create({ careerId: career.id }),
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
      expect(body.total).toBeGreaterThanOrEqual(5)
      expect(body.records).toBeInstanceOf(Array)

      const record = body.records[0]
      expect(record).toHaveProperty('id')
      expect(record).toHaveProperty('name')
      expect(record).toHaveProperty('code')
      expect(record).toHaveProperty('careerId')
      expect(record).toHaveProperty('email')
      expect(record).toHaveProperty('telephone')
      expect(record).toHaveProperty('createdAt')
      expect(record).toHaveProperty('updatedAt')
    })

    it('Success get students with limit parameter', async () => {
      const password = faker.string.alphanumeric(10)
      const user = await userFactory.create({
        password
      })
      
      const token = await jwtService.sign({
        id: user.id,
        name: user.name,
        user: user.user,
        permissions: user.permissions,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        scope: 'user'
      })

      const career = await careerFactory.create({})
      await Promise.all([
        studentFactory.create({ careerId: career.id }),
        studentFactory.create({ careerId: career.id }),
        studentFactory.create({ careerId: career.id }),
        studentFactory.create({ careerId: career.id }),
        studentFactory.create({ careerId: career.id }),
      ])

      const res = await app.inject({
        url: `${PATH}`,
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
      expect(body.total).toBeGreaterThanOrEqual(5)
    })

    it('Success get students with limit and offset parameters', async () => {
      const password = faker.string.alphanumeric(10)
      const user = await userFactory.create({
        password
      })
      
      const token = await jwtService.sign({
        id: user.id,
        name: user.name,
        user: user.user,
        permissions: user.permissions,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        scope: 'user'
      })

      const career = await careerFactory.create({})
      await Promise.all([
        studentFactory.create({ careerId: career.id }),
        studentFactory.create({ careerId: career.id }),
        studentFactory.create({ careerId: career.id }),
        studentFactory.create({ careerId: career.id }),
        studentFactory.create({ careerId: career.id }),
      ])

      const res = await app.inject({
        url: `${PATH}?limit=2&offset=2`,
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
      expect(body.total).toBeGreaterThanOrEqual(5)
    })
  })

  describe('PATCH /students/:id', () => {
    const METHOD = 'PATCH'
    const PATH = '/students/:id'
    
    it('Success update student', async () => {
      const password = faker.string.alphanumeric(10)
      const user = await userFactory.create({
        password
      })
      
      const token = await jwtService.sign({
        id: user.id,
        name: user.name,
        user: user.user,
        permissions: user.permissions,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        scope: 'user'
      })

      const career = await careerFactory.create({})
      const student = await studentFactory.create({ careerId: career.id })

      const updateData = {
        name: faker.person.fullName(),
        telephone: faker.phone.number()
      }

      const res = await app.inject({
        url: PATH.replace(':id', student.id.toString()),
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        },
        payload: updateData
      })
      
      expect(res.statusCode).toBe(204)
    })
  })
})
