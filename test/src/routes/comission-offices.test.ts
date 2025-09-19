import { describe, beforeAll, afterAll, expect } from 'vitest'
import { isolatedIt as it } from '#test/utils/isolatedIt.js'
import build from '#src/build.js'
import { userFactory } from '#test/utils/factories/user.js'
import { comissionOfficeFactory } from '#test/utils/factories/comission-office.js'
import { fileFactory } from '#test/utils/factories/file.js'
import { cycleFactory } from '#test/utils/factories/cycle.js'
import { studentFactory } from '#test/utils/factories/student.js'
import { careerFactory } from '#test/utils/factories/career.js'
import { vacancyFactory } from '#test/utils/factories/vacancy.js'
import { departmentFactory } from '#test/utils/factories/department.js'
import { faker } from '@faker-js/faker'
import configuration from '#src/common/configuration.js'
import { JwtService } from '#src/service/jwt/index.js'

describe('ComissionOffices API', () => {
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

  describe('GET /comission-offices', () => {
    const PATH = '/comission-offices'
    const METHOD = 'GET'

    it('Success get comission offices returns total count and records', async () => {
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
      const career = await careerFactory.create()
      const file = await fileFactory.create()
      
      const student = await studentFactory.create({ careerId: career.id })
      const vacancy = await vacancyFactory.create({ cycleId: cycle.id, departmentId: department.id })

      await Promise.all([
        comissionOfficeFactory.create({ 
          studentId: student.id, 
          vacancyId: vacancy.id, 
          cycleId: cycle.id, 
          fileId: file.id 
        }),
        comissionOfficeFactory.create({ 
          studentId: student.id, 
          vacancyId: vacancy.id, 
          cycleId: cycle.id, 
          fileId: file.id 
        }),
        comissionOfficeFactory.create({ 
          studentId: student.id, 
          vacancyId: vacancy.id, 
          cycleId: cycle.id, 
          fileId: file.id 
        })
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
      expect(record).toHaveProperty('studentId')
      expect(record).toHaveProperty('vacancyId')
      expect(record).toHaveProperty('cycleId')
      expect(record).toHaveProperty('beginDate')
      expect(record).toHaveProperty('status')
      expect(record).toHaveProperty('fileId')
      expect(record).toHaveProperty('createdAt')
      expect(record).toHaveProperty('updatedAt')
    })

    it('Success get comission offices filtered by cycleId', async () => {
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
      const cycle1 = await cycleFactory.create({ slug: '2024A' })
      const cycle2 = await cycleFactory.create({ slug: '2024B' })
      const department = await departmentFactory.create()
      const career = await careerFactory.create()
      const file = await fileFactory.create()
      
      const student = await studentFactory.create({ careerId: career.id })
      const vacancy = await vacancyFactory.create({ cycleId: cycle1.id, departmentId: department.id })

      await Promise.all([
        comissionOfficeFactory.create({ 
          studentId: student.id, 
          vacancyId: vacancy.id, 
          cycleId: cycle1.id, 
          fileId: file.id 
        }),
        comissionOfficeFactory.create({ 
          studentId: student.id, 
          vacancyId: vacancy.id, 
          cycleId: cycle1.id, 
          fileId: file.id 
        }),
        comissionOfficeFactory.create({ 
          studentId: student.id, 
          vacancyId: vacancy.id, 
          cycleId: cycle2.id, 
          fileId: file.id 
        })
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

    it('Success get comission offices filtered by studentId', async () => {
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
      const career = await careerFactory.create()
      const file = await fileFactory.create()
      
      const student1 = await studentFactory.create({ careerId: career.id })
      const student2 = await studentFactory.create({ careerId: career.id })
      const vacancy = await vacancyFactory.create({ cycleId: cycle.id, departmentId: department.id })

      await Promise.all([
        comissionOfficeFactory.create({ 
          studentId: student1.id, 
          vacancyId: vacancy.id, 
          cycleId: cycle.id, 
          fileId: file.id 
        }),
        comissionOfficeFactory.create({ 
          studentId: student1.id, 
          vacancyId: vacancy.id, 
          cycleId: cycle.id, 
          fileId: file.id 
        }),
        comissionOfficeFactory.create({ 
          studentId: student2.id, 
          vacancyId: vacancy.id, 
          cycleId: cycle.id, 
          fileId: file.id 
        })
      ])

      const res = await app.inject({
        url: PATH,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        },
        query: {
          studentId: student1.id.toString()
        }
      })
      
      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.total).toBe(2)
      expect(body.records).toHaveLength(2)

      // All records should have the same studentId
      body.records.forEach((record: any) => {
        expect(record.studentId).toBe(student1.id)
      })
    })

    it('Success get comission offices filtered by vacancyId', async () => {
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
      const career = await careerFactory.create()
      const file = await fileFactory.create()
      
      const student = await studentFactory.create({ careerId: career.id })
      const vacancy1 = await vacancyFactory.create({ cycleId: cycle.id, departmentId: department.id })
      const vacancy2 = await vacancyFactory.create({ cycleId: cycle.id, departmentId: department.id })

      await Promise.all([
        comissionOfficeFactory.create({ 
          studentId: student.id, 
          vacancyId: vacancy1.id, 
          cycleId: cycle.id, 
          fileId: file.id 
        }),
        comissionOfficeFactory.create({ 
          studentId: student.id, 
          vacancyId: vacancy1.id, 
          cycleId: cycle.id, 
          fileId: file.id 
        }),
        comissionOfficeFactory.create({ 
          studentId: student.id, 
          vacancyId: vacancy2.id, 
          cycleId: cycle.id, 
          fileId: file.id 
        })
      ])

      const res = await app.inject({
        url: PATH,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        },
        query: {
          vacancyId: vacancy1.id.toString()
        }
      })
      
      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.total).toBe(2)
      expect(body.records).toHaveLength(2)

      // All records should have the same vacancyId
      body.records.forEach((record: any) => {
        expect(record.vacancyId).toBe(vacancy1.id)
      })
    })

    it('Success get comission offices filtered by status', async () => {
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
      const career = await careerFactory.create()
      const file = await fileFactory.create()
      
      const student = await studentFactory.create({ careerId: career.id })
      const vacancy = await vacancyFactory.create({ cycleId: cycle.id, departmentId: department.id })

      await Promise.all([
        comissionOfficeFactory.create({ 
          studentId: student.id, 
          vacancyId: vacancy.id, 
          cycleId: cycle.id, 
          fileId: file.id,
          status: 'APPROVED'
        }),
        comissionOfficeFactory.create({ 
          studentId: student.id, 
          vacancyId: vacancy.id, 
          cycleId: cycle.id, 
          fileId: file.id,
          status: 'APPROVED'
        }),
        comissionOfficeFactory.create({ 
          studentId: student.id, 
          vacancyId: vacancy.id, 
          cycleId: cycle.id, 
          fileId: file.id,
          status: 'PENDING'
        })
      ])

      const res = await app.inject({
        url: PATH,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        },
        query: {
          status: 'APPROVED'
        }
      })
      
      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.total).toBe(2)
      expect(body.records).toHaveLength(2)

      // All records should have the same status
      body.records.forEach((record: any) => {
        expect(record.status).toBe('APPROVED')
      })
    })

    it('Success get comission offices with combined filters', async () => {
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
      const cycle1 = await cycleFactory.create({ slug: '2024A' })
      const cycle2 = await cycleFactory.create({ slug: '2024B' })
      const department = await departmentFactory.create()
      const career = await careerFactory.create()
      const file = await fileFactory.create()
      
      const student1 = await studentFactory.create({ careerId: career.id })
      const student2 = await studentFactory.create({ careerId: career.id })
      const vacancy = await vacancyFactory.create({ cycleId: cycle1.id, departmentId: department.id })

      await Promise.all([
        comissionOfficeFactory.create({ 
          studentId: student1.id, 
          vacancyId: vacancy.id, 
          cycleId: cycle1.id, 
          fileId: file.id,
          status: 'APPROVED'
        }),
        comissionOfficeFactory.create({ 
          studentId: student1.id, 
          vacancyId: vacancy.id, 
          cycleId: cycle2.id, 
          fileId: file.id,
          status: 'APPROVED'
        }),
        comissionOfficeFactory.create({ 
          studentId: student2.id, 
          vacancyId: vacancy.id, 
          cycleId: cycle1.id, 
          fileId: file.id,
          status: 'APPROVED'
        })
      ])

      const res = await app.inject({
        url: PATH,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        },
        query: {
          cycleId: cycle1.id.toString(),
          studentId: student1.id.toString(),
          status: 'APPROVED'
        }
      })
      
      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.total).toBe(1)
      expect(body.records).toHaveLength(1)

      const record = body.records[0]
      expect(record.cycleId).toBe(cycle1.id)
      expect(record.studentId).toBe(student1.id)
      expect(record.status).toBe('APPROVED')
    })

    it('Success get comission offices with limit parameter', async () => {
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
      const career = await careerFactory.create()
      const file = await fileFactory.create()
      
      const student = await studentFactory.create({ careerId: career.id })
      const vacancy = await vacancyFactory.create({ cycleId: cycle.id, departmentId: department.id })

      await Promise.all([
        comissionOfficeFactory.create({ 
          studentId: student.id, 
          vacancyId: vacancy.id, 
          cycleId: cycle.id, 
          fileId: file.id 
        }),
        comissionOfficeFactory.create({ 
          studentId: student.id, 
          vacancyId: vacancy.id, 
          cycleId: cycle.id, 
          fileId: file.id 
        }),
        comissionOfficeFactory.create({ 
          studentId: student.id, 
          vacancyId: vacancy.id, 
          cycleId: cycle.id, 
          fileId: file.id 
        }),
        comissionOfficeFactory.create({ 
          studentId: student.id, 
          vacancyId: vacancy.id, 
          cycleId: cycle.id, 
          fileId: file.id 
        }),
        comissionOfficeFactory.create({ 
          studentId: student.id, 
          vacancyId: vacancy.id, 
          cycleId: cycle.id, 
          fileId: file.id 
        })
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

    it('Success get comission offices with limit and offset parameters', async () => {
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
      const career = await careerFactory.create()
      const file = await fileFactory.create()
      
      const student = await studentFactory.create({ careerId: career.id })
      const vacancy = await vacancyFactory.create({ cycleId: cycle.id, departmentId: department.id })

      await Promise.all([
        comissionOfficeFactory.create({ 
          studentId: student.id, 
          vacancyId: vacancy.id, 
          cycleId: cycle.id, 
          fileId: file.id 
        }),
        comissionOfficeFactory.create({ 
          studentId: student.id, 
          vacancyId: vacancy.id, 
          cycleId: cycle.id, 
          fileId: file.id 
        }),
        comissionOfficeFactory.create({ 
          studentId: student.id, 
          vacancyId: vacancy.id, 
          cycleId: cycle.id, 
          fileId: file.id 
        }),
        comissionOfficeFactory.create({ 
          studentId: student.id, 
          vacancyId: vacancy.id, 
          cycleId: cycle.id, 
          fileId: file.id 
        }),
        comissionOfficeFactory.create({ 
          studentId: student.id, 
          vacancyId: vacancy.id, 
          cycleId: cycle.id, 
          fileId: file.id 
        })
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

    it('Success get comission offices with order parameter', async () => {
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
      const career = await careerFactory.create()
      const file = await fileFactory.create()
      
      const student = await studentFactory.create({ careerId: career.id })
      const vacancy = await vacancyFactory.create({ cycleId: cycle.id, departmentId: department.id })

      await Promise.all([
        comissionOfficeFactory.create({ 
          studentId: student.id, 
          vacancyId: vacancy.id, 
          cycleId: cycle.id, 
          fileId: file.id 
        }),
        comissionOfficeFactory.create({ 
          studentId: student.id, 
          vacancyId: vacancy.id, 
          cycleId: cycle.id, 
          fileId: file.id 
        }),
        comissionOfficeFactory.create({ 
          studentId: student.id, 
          vacancyId: vacancy.id, 
          cycleId: cycle.id, 
          fileId: file.id 
        })
      ])

      const res = await app.inject({
        url: PATH,
        method: METHOD,
        query: {
          order: 'ComissionOffices.id'
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

    it('Returns 403 when user lacks VIEW_STUDENT permission', async () => {
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

      // Create test data
      const cycle = await cycleFactory.create()
      const department = await departmentFactory.create()
      const career = await careerFactory.create()
      const file = await fileFactory.create()
      
      const student = await studentFactory.create({ careerId: career.id })
      const vacancy = await vacancyFactory.create({ cycleId: cycle.id, departmentId: department.id })

      await comissionOfficeFactory.create({ 
        studentId: student.id, 
        vacancyId: vacancy.id, 
        cycleId: cycle.id, 
        fileId: file.id 
      })

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

      // Create test data
      const cycle = await cycleFactory.create()
      const department = await departmentFactory.create()
      const career = await careerFactory.create()
      const file = await fileFactory.create()
      
      const student = await studentFactory.create({ careerId: career.id })
      const vacancy = await vacancyFactory.create({ cycleId: cycle.id, departmentId: department.id })

      await comissionOfficeFactory.create({ 
        studentId: student.id, 
        vacancyId: vacancy.id, 
        cycleId: cycle.id, 
        fileId: file.id 
      })

      const res = await app.inject({
        url: PATH,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        }
      })
      
      expect(res.statusCode).toBe(200)
      const body = res.json()
      
      const record = body.records[0]
      
      // Verify dates are formatted correctly
      expect(typeof record.beginDate).toBe('string')
      expect(typeof record.createdAt).toBe('string')
      expect(typeof record.updatedAt).toBe('string')
      expect(() => new Date(record.beginDate)).not.toThrow()
      expect(() => new Date(record.createdAt)).not.toThrow()
      expect(() => new Date(record.updatedAt)).not.toThrow()
      
      // Verify beginDate is formatted as date (YYYY-MM-DD)
      expect(record.beginDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      
      // Verify createdAt and updatedAt are formatted as ISO strings
      expect(record.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
      expect(record.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
    })
  })
})
