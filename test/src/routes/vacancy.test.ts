import { describe, beforeAll, afterAll, expect } from 'vitest'
import { isolatedIt as it } from '#test/utils/isolatedIt'
import build from '#src/build'
import { userFactory } from '#test/utils/factories/user'
import { vacancyFactory } from '#test/utils/factories/vacancy'
import { cycleFactory } from '#test/utils/factories/cycle'
import { departmentFactory } from '#test/utils/factories/department'
import { studentFactory } from '#test/utils/factories/student'
import { careerFactory } from '#test/utils/factories/career'
import { vacancyToStudentFactory } from '#test/utils/factories/vacancy-to-student'
import { faker } from '@faker-js/faker'
import configuration from '#src/common/configuration'
import { JwtService } from '#src/service/jwt'

describe('Vacancies API', () => {
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

  describe('GET /vacancies', () => {
    const PATH = '/vacancies'
    const METHOD = 'GET'

    it('Success get vacancies returns total count and records', async () => {
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

      const cycle = await cycleFactory.create()
      const department = await departmentFactory.create()

      await Promise.all([
        vacancyFactory.create({ cycleId: cycle.id, departmentId: department.id }),
        vacancyFactory.create({ cycleId: cycle.id, departmentId: department.id }),
        vacancyFactory.create({ cycleId: cycle.id, departmentId: department.id })
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
      expect(body.total).toBe(3)
      expect(body.records).toBeInstanceOf(Array)

      const record = body.records[0]
      expect(record).toHaveProperty('id')
      expect(record).toHaveProperty('name')
      expect(record).toHaveProperty('description')
      expect(record).toHaveProperty('slots')
      expect(record).toHaveProperty('cycleId')
      expect(record).toHaveProperty('departmentId')
      expect(record).toHaveProperty('disabled')
      expect(record).toHaveProperty('createdAt')
      expect(record).toHaveProperty('updatedAt')
    })

    it('Success get vacancies with includeCycle=true', async () => {
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

      const cycle = await cycleFactory.create({ slug: '2024A', isCurrent: true })
      const department = await departmentFactory.create()

      await vacancyFactory.create({ cycleId: cycle.id, departmentId: department.id })

      const res = await app.inject({
        url: PATH,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        },
        query: {
          includeCycle: 'true'
        }
      })
      
      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.total).toBe(1)
      expect(body.records).toHaveLength(1)

      const record = body.records[0]
      expect(record).toHaveProperty('cycle')
      expect(record.cycle).toHaveProperty('id', cycle.id)
      expect(record.cycle).toHaveProperty('slug', cycle.slug)
      expect(record.cycle).toHaveProperty('isCurrent', cycle.isCurrent)
    })

    it('Success get vacancies with includeDepartment=true', async () => {
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

      const cycle = await cycleFactory.create()
      const department = await departmentFactory.create({ name: 'IT Department' })

      await vacancyFactory.create({ cycleId: cycle.id, departmentId: department.id })

      const res = await app.inject({
        url: PATH,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        },
        query: {
          includeDepartment: 'true'
        }
      })
      
      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.total).toBe(1)
      expect(body.records).toHaveLength(1)

      const record = body.records[0]
      expect(record).toHaveProperty('department')
      expect(record.department).toHaveProperty('id', department.id)
      expect(record.department).toHaveProperty('name', department.name)
    })

    it('Success get vacancies with both includes', async () => {
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

      const cycle = await cycleFactory.create()
      const department = await departmentFactory.create()

      await vacancyFactory.create({ cycleId: cycle.id, departmentId: department.id })

      const res = await app.inject({
        url: PATH,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        },
        query: {
          includeCycle: 'true',
          includeDepartment: 'true'
        }
      })

      console.log(res.payload)
      
      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.total).toBe(1)
      expect(body.records).toHaveLength(1)

      const record = body.records[0]
      expect(record).toHaveProperty('cycle')
      expect(record).toHaveProperty('department')
      expect(record.cycle).toHaveProperty('id', cycle.id)
      expect(record.department).toHaveProperty('id', department.id)
    })

    it('Success get vacancies with search query param', async () => {
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

      const cycle = await cycleFactory.create()
      const department = await departmentFactory.create()

      const [vacancy] = await Promise.all([
        vacancyFactory.create({ 
          name: 'IT Support Specialist',
          cycleId: cycle.id,
          departmentId: department.id
        }),
        vacancyFactory.create({ 
          name: 'Marketing Assistant',
          cycleId: cycle.id,
          departmentId: department.id
        })
      ])

      const res = await app.inject({
        url: PATH,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        },
        query: {
          search: vacancy.name
        }
      })

      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.total).toBe(1)
      expect(body.records).toHaveLength(1)

      const record = body.records[0]
      expect(record).toHaveProperty('id', vacancy.id)
      expect(record).toHaveProperty('name', vacancy.name)
    })

    it('Success get vacancies with limit parameter', async () => {
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

      const cycle = await cycleFactory.create()
      const department = await departmentFactory.create()

      await Promise.all([
        vacancyFactory.create({ cycleId: cycle.id, departmentId: department.id }),
        vacancyFactory.create({ cycleId: cycle.id, departmentId: department.id }),
        vacancyFactory.create({ cycleId: cycle.id, departmentId: department.id }),
        vacancyFactory.create({ cycleId: cycle.id, departmentId: department.id }),
        vacancyFactory.create({ cycleId: cycle.id, departmentId: department.id })
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

    it('Success get vacancies with limit and offset parameters', async () => {
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

      const cycle = await cycleFactory.create()
      const department = await departmentFactory.create()

      await Promise.all([
        vacancyFactory.create({ cycleId: cycle.id, departmentId: department.id }),
        vacancyFactory.create({ cycleId: cycle.id, departmentId: department.id }),
        vacancyFactory.create({ cycleId: cycle.id, departmentId: department.id }),
        vacancyFactory.create({ cycleId: cycle.id, departmentId: department.id }),
        vacancyFactory.create({ cycleId: cycle.id, departmentId: department.id })
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

    it('Success get vacancies with order parameter', async () => {
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

      const cycle = await cycleFactory.create()
      const department = await departmentFactory.create()

      await Promise.all([
        vacancyFactory.create({ cycleId: cycle.id, departmentId: department.id }),
        vacancyFactory.create({ cycleId: cycle.id, departmentId: department.id }),
        vacancyFactory.create({ cycleId: cycle.id, departmentId: department.id })
      ])

      const res = await app.inject({
        url: PATH,
        method: METHOD,
        query: {
          order: 'Vacancies.id'
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

    it('Returns 403 when user lacks VIEW_VACANCY permission', async () => {
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

    it('Success get vacancies filtered by departmentId', async () => {
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

      const cycle = await cycleFactory.create()
      const department1 = await departmentFactory.create({ name: 'IT Department' })
      const department2 = await departmentFactory.create({ name: 'HR Department' })

      await Promise.all([
        vacancyFactory.create({ cycleId: cycle.id, departmentId: department1.id }),
        vacancyFactory.create({ cycleId: cycle.id, departmentId: department1.id }),
        vacancyFactory.create({ cycleId: cycle.id, departmentId: department2.id })
      ])

      const res = await app.inject({
        url: PATH,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        },
        query: {
          departmentId: department1.id.toString()
        }
      })
      
      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.total).toBe(2)
      expect(body.records).toHaveLength(2)

      // All records should have the same departmentId
      body.records.forEach((record: any) => {
        expect(record.departmentId).toBe(department1.id)
      })
    })

    it('Success get vacancies filtered by cycleId', async () => {
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

      const cycle1 = await cycleFactory.create({ slug: '2024A' })
      const cycle2 = await cycleFactory.create({ slug: '2024B' })
      const department = await departmentFactory.create()

      await Promise.all([
        vacancyFactory.create({ cycleId: cycle1.id, departmentId: department.id }),
        vacancyFactory.create({ cycleId: cycle1.id, departmentId: department.id }),
        vacancyFactory.create({ cycleId: cycle2.id, departmentId: department.id })
      ])

      const res = await app.inject({
        url: PATH,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        },
        query: {
          cycleId: cycle1.id.toString()
        }
      })
      
      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.total).toBe(2)
      expect(body.records).toHaveLength(2)

      // All records should have the same cycleId
      body.records.forEach((record: any) => {
        expect(record.cycleId).toBe(cycle1.id)
      })
    })

    it('Success get vacancies filtered by both departmentId and cycleId', async () => {
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

      const cycle1 = await cycleFactory.create({ slug: '2024A' })
      const cycle2 = await cycleFactory.create({ slug: '2024B' })
      const department1 = await departmentFactory.create({ name: 'IT Department' })
      const department2 = await departmentFactory.create({ name: 'HR Department' })

      await Promise.all([
        vacancyFactory.create({ cycleId: cycle1.id, departmentId: department1.id }),
        vacancyFactory.create({ cycleId: cycle1.id, departmentId: department2.id }),
        vacancyFactory.create({ cycleId: cycle2.id, departmentId: department1.id }),
        vacancyFactory.create({ cycleId: cycle2.id, departmentId: department2.id })
      ])

      const res = await app.inject({
        url: PATH,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        },
        query: {
          departmentId: department1.id.toString(),
          cycleId: cycle1.id.toString()
        }
      })
      
      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.total).toBe(1)
      expect(body.records).toHaveLength(1)

      const record = body.records[0]
      expect(record.departmentId).toBe(department1.id)
      expect(record.cycleId).toBe(cycle1.id)
    })

    it('Returns empty results when filtering by non-existent departmentId', async () => {
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

      const cycle = await cycleFactory.create()
      const department = await departmentFactory.create()

      await vacancyFactory.create({ cycleId: cycle.id, departmentId: department.id })

      const res = await app.inject({
        url: PATH,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        },
        query: {
          departmentId: '99999'
        }
      })
      
      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.total).toBe(0)
      expect(body.records).toHaveLength(0)
    })

    it('Returns empty results when filtering by non-existent cycleId', async () => {
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

      const cycle = await cycleFactory.create()
      const department = await departmentFactory.create()

      await vacancyFactory.create({ cycleId: cycle.id, departmentId: department.id })

      const res = await app.inject({
        url: PATH,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        },
        query: {
          cycleId: '99999'
        }
      })
      
      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.total).toBe(0)
      expect(body.records).toHaveLength(0)
    })
  })

  describe('GET /vacancies/:id/students', () => {
    it('Success get students associated to a vacancy', async () => {
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

      // Create test data
      const cycle = await cycleFactory.create()
      const department = await departmentFactory.create()
      const vacancy = await vacancyFactory.create({ 
        cycleId: cycle.id, 
        departmentId: department.id 
      })

      const career = await careerFactory.create()
      const [student1, student2] = await Promise.all([
        studentFactory.create({ careerId: career.id }),
        studentFactory.create({ careerId: career.id }),
        studentFactory.create({ careerId: career.id })
      ])

      // Associate students with the vacancy
      await Promise.all([
        vacancyToStudentFactory.create({
          vacancyId: vacancy.id,
          studentId: student1.id
        }),
        vacancyToStudentFactory.create({
          vacancyId: vacancy.id,
          studentId: student2.id
        })
      ])

      const res = await app.inject({
        url: `/vacancies/${vacancy.id}/students`,
        method: 'GET',
        headers: {
          authorization: `Bearer ${token}`
        }
      })
      
      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body).toBeInstanceOf(Array)
      expect(body).toHaveLength(2)

      // Check first student structure
      const student = body[0]
      expect(student).toHaveProperty('id')
      expect(student).toHaveProperty('name')
      expect(student).toHaveProperty('code')
      expect(student).toHaveProperty('careerId')
      expect(student).toHaveProperty('email')
      expect(student).toHaveProperty('telephone')
      expect(student).toHaveProperty('createdAt')
      expect(student).toHaveProperty('updatedAt')
      expect(student).toHaveProperty('career')

      // Check career structure
      expect(student.career).toHaveProperty('id', career.id)
      expect(student.career).toHaveProperty('name', career.name)
      expect(student.career).toHaveProperty('slug', career.slug)
      expect(student.career).toHaveProperty('createdAt')
      expect(student.career).toHaveProperty('updatedAt')

      // Verify the students returned are the ones associated with the vacancy
      const studentIds = body.map((s: any) => s.id).sort()
      expect(studentIds).toEqual([student1.id, student2.id].sort())
    })

    it('Returns empty array when vacancy has no associated students', async () => {
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

      // Create vacancy without students
      const cycle = await cycleFactory.create()
      const department = await departmentFactory.create()
      const vacancy = await vacancyFactory.create({ 
        cycleId: cycle.id, 
        departmentId: department.id 
      })

      const res = await app.inject({
        url: `/vacancies/${vacancy.id}/students`,
        method: 'GET',
        headers: {
          authorization: `Bearer ${token}`
        }
      })
      
      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body).toBeInstanceOf(Array)
      expect(body).toHaveLength(0)
    })

    it('Returns 400 when no authorization token provided', async () => {
      const cycle = await cycleFactory.create()
      const department = await departmentFactory.create()
      const vacancy = await vacancyFactory.create({ 
        cycleId: cycle.id, 
        departmentId: department.id 
      })

      const res = await app.inject({
        url: `/vacancies/${vacancy.id}/students`,
        method: 'GET'
      })
      
      expect(res.statusCode).toBe(400)
      const body = res.json()
      expect(body).toHaveProperty('message', 'headers must have required property \'authorization\'')
    })

    it('Returns 403 when user lacks VIEW_VACANCY permission', async () => {
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

      const cycle = await cycleFactory.create()
      const department = await departmentFactory.create()
      const vacancy = await vacancyFactory.create({ 
        cycleId: cycle.id, 
        departmentId: department.id 
      })

      const res = await app.inject({
        url: `/vacancies/${vacancy.id}/students`,
        method: 'GET',
        headers: {
          authorization: `Bearer ${token}`
        }
      })
      
      expect(res.statusCode).toBe(403)
    })

    it('Returns 400 when vacancy id is not a valid integer', async () => {
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
        url: '/vacancies/invalid-id/students',
        method: 'GET',
        headers: {
          authorization: `Bearer ${token}`
        }
      })
      
      expect(res.statusCode).toBe(400)
    })
  })

  describe('GET /vacancies/:id', () => {
    it('Success get vacancy by ID without includes', async () => {
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

      const cycle = await cycleFactory.create()
      const department = await departmentFactory.create()
      const vacancy = await vacancyFactory.create({ 
        cycleId: cycle.id, 
        departmentId: department.id,
        name: 'Software Engineer',
        description: 'Frontend development position'
      })

      const res = await app.inject({
        url: `/vacancies/${vacancy.id}`,
        method: 'GET',
        headers: {
          authorization: `Bearer ${token}`
        }
      })
      
      expect(res.statusCode).toBe(200)
      const body = res.json()
      
      expect(body).toHaveProperty('id', vacancy.id)
      expect(body).toHaveProperty('name', vacancy.name)
      expect(body).toHaveProperty('description', vacancy.description)
      expect(body).toHaveProperty('slots', vacancy.slots)
      expect(body).toHaveProperty('cycleId', vacancy.cycleId)
      expect(body).toHaveProperty('departmentId', vacancy.departmentId)
      expect(body).toHaveProperty('disabled', vacancy.disabled)
      expect(body).toHaveProperty('createdAt')
      expect(body).toHaveProperty('updatedAt')
      
      // Should not include cycle or department data
      expect(body.cycle).toBeUndefined()
      expect(body.department).toBeUndefined()
    })

    it('Success get vacancy by ID with includeCycle=true', async () => {
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

      const cycle = await cycleFactory.create({ slug: '2024A', isCurrent: true })
      const department = await departmentFactory.create()
      const vacancy = await vacancyFactory.create({ 
        cycleId: cycle.id, 
        departmentId: department.id 
      })

      const res = await app.inject({
        url: `/vacancies/${vacancy.id}`,
        method: 'GET',
        headers: {
          authorization: `Bearer ${token}`
        },
        query: {
          includeCycle: 'true'
        }
      })
      
      expect(res.statusCode).toBe(200)
      const body = res.json()
      
      expect(body).toHaveProperty('id', vacancy.id)
      expect(body).toHaveProperty('cycle')
      expect(body.cycle).toHaveProperty('id', cycle.id)
      expect(body.cycle).toHaveProperty('slug', cycle.slug)
      expect(body.cycle).toHaveProperty('isCurrent', cycle.isCurrent)
      
      // Should not include department data
      expect(body.department).toBeUndefined()
    })

    it('Success get vacancy by ID with includeDepartment=true', async () => {
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

      const cycle = await cycleFactory.create()
      const department = await departmentFactory.create({ name: 'IT Department' })
      const vacancy = await vacancyFactory.create({ 
        cycleId: cycle.id, 
        departmentId: department.id 
      })

      const res = await app.inject({
        url: `/vacancies/${vacancy.id}`,
        method: 'GET',
        headers: {
          authorization: `Bearer ${token}`
        },
        query: {
          includeDepartment: 'true'
        }
      })
      
      expect(res.statusCode).toBe(200)
      const body = res.json()
      
      expect(body).toHaveProperty('id', vacancy.id)
      expect(body).toHaveProperty('department')
      expect(body.department).toHaveProperty('id', department.id)
      expect(body.department).toHaveProperty('name', department.name)
      
      // Should not include cycle data
      expect(body.cycle).toBeUndefined()
    })

    it('Success get vacancy by ID with both includes', async () => {
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

      const cycle = await cycleFactory.create({ slug: '2024B', isCurrent: false })
      const department = await departmentFactory.create({ name: 'HR Department' })
      const vacancy = await vacancyFactory.create({ 
        cycleId: cycle.id, 
        departmentId: department.id 
      })

      const res = await app.inject({
        url: `/vacancies/${vacancy.id}`,
        method: 'GET',
        headers: {
          authorization: `Bearer ${token}`
        },
        query: {
          includeCycle: 'true',
          includeDepartment: 'true'
        }
      })
      
      expect(res.statusCode).toBe(200)
      const body = res.json()
      
      expect(body).toHaveProperty('id', vacancy.id)
      expect(body).toHaveProperty('cycle')
      expect(body).toHaveProperty('department')
      
      expect(body.cycle).toHaveProperty('id', cycle.id)
      expect(body.cycle).toHaveProperty('slug', cycle.slug)
      expect(body.cycle).toHaveProperty('isCurrent', cycle.isCurrent)
      
      expect(body.department).toHaveProperty('id', department.id)
      expect(body.department).toHaveProperty('name', department.name)
    })

    it('Returns 404 when vacancy does not exist', async () => {
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
        url: '/vacancies/99999',
        method: 'GET',
        headers: {
          authorization: `Bearer ${token}`
        }
      })
      
      expect(res.statusCode).toBe(404)
      const body = res.json()
      expect(body).toHaveProperty('message', 'Vacancy not found')
    })

    it('Returns 400 when no authorization token provided', async () => {
      const cycle = await cycleFactory.create()
      const department = await departmentFactory.create()
      const vacancy = await vacancyFactory.create({ 
        cycleId: cycle.id, 
        departmentId: department.id 
      })

      const res = await app.inject({
        url: `/vacancies/${vacancy.id}`,
        method: 'GET'
      })
      
      expect(res.statusCode).toBe(400)
      const body = res.json()
      expect(body).toHaveProperty('message', 'headers must have required property \'authorization\'')
    })

    it('Returns 403 when user lacks VIEW_VACANCY permission', async () => {
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

      const cycle = await cycleFactory.create()
      const department = await departmentFactory.create()
      const vacancy = await vacancyFactory.create({ 
        cycleId: cycle.id, 
        departmentId: department.id 
      })

      const res = await app.inject({
        url: `/vacancies/${vacancy.id}`,
        method: 'GET',
        headers: {
          authorization: `Bearer ${token}`
        }
      })
      
      expect(res.statusCode).toBe(403)
    })

    it('Returns 400 when vacancy id is not a valid integer', async () => {
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
        url: '/vacancies/invalid-id',
        method: 'GET',
        headers: {
          authorization: `Bearer ${token}`
        }
      })
      
      expect(res.statusCode).toBe(400)
    })

    it('Success verify date formatting in response', async () => {
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

      const cycle = await cycleFactory.create()
      const department = await departmentFactory.create()
      const vacancy = await vacancyFactory.create({ 
        cycleId: cycle.id, 
        departmentId: department.id 
      })

      const res = await app.inject({
        url: `/vacancies/${vacancy.id}`,
        method: 'GET',
        headers: {
          authorization: `Bearer ${token}`
        }
      })
      
      expect(res.statusCode).toBe(200)
      const body = res.json()
      
      // Verify dates are formatted as ISO strings
      expect(typeof body.createdAt).toBe('string')
      expect(typeof body.updatedAt).toBe('string')
      expect(() => new Date(body.createdAt)).not.toThrow()
      expect(() => new Date(body.updatedAt)).not.toThrow()
      
      // Verify ISO format
      expect(body.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
      expect(body.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
    })
  })

  describe('POST /vacancies', () => {
    const PATH = '/vacancies'
    const METHOD = 'POST'

    it('Success create vacancy with valid data', async () => {
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

      const cycle = await cycleFactory.create()
      const department = await departmentFactory.create()

      const vacancyData = {
        name: 'Software Engineer',
        description: 'Full-stack development position',
        slots: 5,
        cycleId: cycle.id,
        departmentId: department.id,
        disabled: false
      }

      const res = await app.inject({
        url: PATH,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        },
        payload: vacancyData
      })
      
      expect(res.statusCode).toBe(201)
      const body = res.json()
      
      expect(body).toHaveProperty('id')
      expect(body).toHaveProperty('name', vacancyData.name)
      expect(body).toHaveProperty('description', vacancyData.description)
      expect(body).toHaveProperty('slots', vacancyData.slots)
      expect(body).toHaveProperty('cycleId', vacancyData.cycleId)
      expect(body).toHaveProperty('departmentId', vacancyData.departmentId)
      expect(body).toHaveProperty('disabled', vacancyData.disabled)
      expect(body).toHaveProperty('createdAt')
      expect(body).toHaveProperty('updatedAt')
      
      // Verify date format
      expect(typeof body.createdAt).toBe('string')
      expect(typeof body.updatedAt).toBe('string')
      expect(() => new Date(body.createdAt)).not.toThrow()
      expect(() => new Date(body.updatedAt)).not.toThrow()
    })

    it('Success create vacancy with disabled=true', async () => {
      const password = faker.string.alphanumeric(10)
      const user = await userFactory.create({
        password,
        permissions: ['EDIT_VACANCY']
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

      const cycle = await cycleFactory.create()
      const department = await departmentFactory.create()

      const vacancyData = {
        name: 'Marketing Specialist',
        description: 'Digital marketing role',
        slots: 2,
        cycleId: cycle.id,
        departmentId: department.id,
        disabled: true
      }

      const res = await app.inject({
        url: PATH,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        },
        payload: vacancyData
      })
      
      expect(res.statusCode).toBe(201)
      const body = res.json()
      expect(body.disabled).toBe(true)
    })

    it('Returns 400 when required fields are missing', async () => {
      const password = faker.string.alphanumeric(10)
      const user = await userFactory.create({
        password,
        permissions: ['EDIT_VACANCY']
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

      const invalidData = {
        name: 'Software Engineer'
      }

      const res = await app.inject({
        url: PATH,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        },
        payload: invalidData
      })
      
      expect(res.statusCode).toBe(400)
    })

    it('Returns 400 when name is missing', async () => {
      const password = faker.string.alphanumeric(10)
      const user = await userFactory.create({
        password,
        permissions: ['EDIT_VACANCY']
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

      const cycle = await cycleFactory.create()
      const department = await departmentFactory.create()

      const invalidData = {
        description: 'Frontend development position',
        slots: 3,
        cycleId: cycle.id,
        departmentId: department.id,
        disabled: false
      }

      const res = await app.inject({
        url: PATH,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        },
        payload: invalidData
      })
      
      expect(res.statusCode).toBe(400)
    })

    it('Returns 400 when slots is not an integer', async () => {
      const password = faker.string.alphanumeric(10)
      const user = await userFactory.create({
        password,
        permissions: ['EDIT_VACANCY']
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

      const cycle = await cycleFactory.create()
      const department = await departmentFactory.create()

      const invalidData = {
        name: 'Software Engineer',
        description: 'Frontend development position',
        slots: 'invalid',
        cycleId: cycle.id,
        departmentId: department.id,
        disabled: false
      }

      const res = await app.inject({
        url: PATH,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        },
        payload: invalidData
      })
      
      expect(res.statusCode).toBe(400)
    })

    it('Returns 400 when cycleId is not an integer', async () => {
      const password = faker.string.alphanumeric(10)
      const user = await userFactory.create({
        password,
        permissions: ['EDIT_VACANCY']
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

      const invalidData = {
        name: 'Software Engineer',
        description: 'Frontend development position',
        slots: 3,
        cycleId: 'invalid',
        departmentId: department.id,
        disabled: false
      }

      const res = await app.inject({
        url: PATH,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        },
        payload: invalidData
      })
      
      expect(res.statusCode).toBe(400)
    })

    it('Returns 400 when departmentId is not an integer', async () => {
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

      const cycle = await cycleFactory.create()

      const invalidData = {
        name: 'Software Engineer',
        description: 'Frontend development position',
        slots: 3,
        cycleId: cycle.id,
        departmentId: 'invalid',
        disabled: false
      }

      const res = await app.inject({
        url: PATH,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        },
        payload: invalidData
      })
      
      expect(res.statusCode).toBe(400)
    })

    it('Returns 400 when no authorization token provided', async () => {
      const cycle = await cycleFactory.create()
      const department = await departmentFactory.create()

      const vacancyData = {
        name: 'Software Engineer',
        description: 'Full-stack development position',
        slots: 5,
        cycleId: cycle.id,
        departmentId: department.id,
        disabled: false
      }

      const res = await app.inject({
        url: PATH,
        method: METHOD,
        payload: vacancyData
      })
      
      expect(res.statusCode).toBe(400)
      const body = res.json()
      expect(body).toHaveProperty('message', 'headers must have required property \'authorization\'')
    })

    it('Returns 403 when user lacks EDIT_VACANCY permission', async () => {
      const password = faker.string.alphanumeric(10)
      const user = await userFactory.create({
        password,
        role: 'base'
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

      const cycle = await cycleFactory.create()
      const department = await departmentFactory.create()

      const vacancyData = {
        name: 'Software Engineer',
        description: 'Full-stack development position',
        slots: 5,
        cycleId: cycle.id,
        departmentId: department.id,
        disabled: false
      }

      const res = await app.inject({
        url: PATH,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        },
        payload: vacancyData
      })
      
      expect(res.statusCode).toBe(403)
    })

    it('Returns 409 when trying to create vacancy with non-existent cycleId', async () => {
      const password = faker.string.alphanumeric(10)
      const user = await userFactory.create({
        password,
        role: 'admin',
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

      const vacancyData = {
        name: 'Software Engineer',
        description: 'Full-stack development position',
        slots: 5,
        cycleId: 99999,
        departmentId: department.id,
        disabled: false
      }

      const res = await app.inject({
        url: PATH,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        },
        payload: vacancyData
      })
      
      expect(res.statusCode).toBe(409)
    })

    it('Returns 409 when trying to create vacancy with non-existent departmentId', async () => {
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

      const cycle = await cycleFactory.create()

      const vacancyData = {
        name: 'Software Engineer',
        description: 'Full-stack development position',
        slots: 5,
        cycleId: cycle.id,
        departmentId: 99999,
        disabled: false
      }

      const res = await app.inject({
        url: PATH,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        },
        payload: vacancyData
      })

      expect(res.statusCode).toBe(409)
    })
  })
})
