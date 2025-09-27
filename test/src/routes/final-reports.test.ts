import { describe, beforeAll, afterAll, expect } from 'vitest'
import { isolatedIt as it } from '#test/utils/isolatedIt.js'
import build from '#src/build.js'
import { userFactory } from '#test/utils/factories/user.js'
import { finalReportFactory } from '#test/utils/factories/final-report.js'
import { fileFactory } from '#test/utils/factories/file.js'
import { cycleFactory } from '#test/utils/factories/cycle.js'
import { studentFactory } from '#test/utils/factories/student.js'
import { careerFactory } from '#test/utils/factories/career.js'
import { vacancyFactory } from '#test/utils/factories/vacancy.js'
import { departmentFactory } from '#test/utils/factories/department.js'
import { faker } from '@faker-js/faker'
import configuration from '#src/common/configuration.js'
import { JwtService } from '#src/service/jwt/index.js'

describe('FinalReports API', () => {
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

  describe('GET /final-reports', () => {
    const PATH = '/final-reports'
    const METHOD = 'GET'

    it('Success get final reports returns total count and records', async () => {
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
      const cycle = await cycleFactory.create({
        slug: '2024A'
      })
      const cycle2 = await cycleFactory.create({
        slug: '2024B'
      })
      const cycle3 = await cycleFactory.create({
        slug: '2025A'
      })
      const department = await departmentFactory.create()
      const career = await careerFactory.create()
      const file = await fileFactory.create()
      
      const student = await studentFactory.create({ careerId: career.id })
      const vacancy = await vacancyFactory.create({ cycleId: cycle.id, departmentId: department.id })

      await Promise.all([
        finalReportFactory.create({ 
          studentId: student.id, 
          vacancyId: vacancy.id, 
          cycleId: cycle.id, 
          fileId: file.id 
        }),
        finalReportFactory.create({ 
          studentId: student.id, 
          vacancyId: vacancy.id, 
          cycleId: cycle2.id, 
          fileId: file.id 
        }),
        finalReportFactory.create({ 
          studentId: student.id, 
          vacancyId: vacancy.id, 
          cycleId: cycle3.id, 
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
      expect(record).toHaveProperty('status')
      expect(record).toHaveProperty('hours')
      expect(record).toHaveProperty('fileId')
      expect(record).toHaveProperty('createdAt')
      expect(record).toHaveProperty('updatedAt')
    })

    it('Success get final reports filtered by cycleId', async () => {
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
      const student2 = await studentFactory.create({ careerId: career.id })
      const student3 = await studentFactory.create({ careerId: career.id })
      const vacancy = await vacancyFactory.create({ cycleId: cycle1.id, departmentId: department.id })

      await Promise.all([
        finalReportFactory.create({ 
          studentId: student.id, 
          vacancyId: vacancy.id, 
          cycleId: cycle1.id, 
          fileId: file.id 
        }),
        finalReportFactory.create({ 
          studentId: student2.id, 
          vacancyId: vacancy.id, 
          cycleId: cycle1.id, 
          fileId: file.id 
        }),
        finalReportFactory.create({ 
          studentId: student3.id, 
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

    it('Success get final reports filtered by studentId', async () => {
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
      const cycle = await cycleFactory.create({ slug: '2024A' })
      const cycle2 = await cycleFactory.create({ slug: '2024B' })
      const department = await departmentFactory.create()
      const career = await careerFactory.create()
      const file = await fileFactory.create()
      
      const student1 = await studentFactory.create({ careerId: career.id })
      const student2 = await studentFactory.create({ careerId: career.id })
      const vacancy = await vacancyFactory.create({ cycleId: cycle.id, departmentId: department.id })

      await Promise.all([
        finalReportFactory.create({ 
          studentId: student1.id, 
          vacancyId: vacancy.id, 
          cycleId: cycle.id, 
          fileId: file.id 
        }),
        finalReportFactory.create({ 
          studentId: student1.id, 
          vacancyId: vacancy.id, 
          cycleId: cycle2.id, 
          fileId: file.id 
        }),
        finalReportFactory.create({ 
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

    it('Success get final reports filtered by vacancyId', async () => {
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
      const student2 = await studentFactory.create({ careerId: career.id })
      const vacancy1 = await vacancyFactory.create({ cycleId: cycle.id, departmentId: department.id })
      const vacancy2 = await vacancyFactory.create({ cycleId: cycle.id, departmentId: department.id })

      await Promise.all([
        finalReportFactory.create({ 
          studentId: student.id, 
          vacancyId: vacancy1.id, 
          cycleId: cycle.id, 
          fileId: file.id 
        }),
        finalReportFactory.create({ 
          studentId: student2.id, 
          vacancyId: vacancy1.id, 
          cycleId: cycle.id, 
          fileId: file.id 
        }),
        finalReportFactory.create({ 
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

    it('Success get final reports filtered by status', async () => {
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
      const student2 = await studentFactory.create({ careerId: career.id })
      const student3 = await studentFactory.create({ careerId: career.id })
      const vacancy = await vacancyFactory.create({ cycleId: cycle.id, departmentId: department.id })

      await Promise.all([
        finalReportFactory.create({ 
          studentId: student.id, 
          vacancyId: vacancy.id, 
          cycleId: cycle.id, 
          fileId: file.id,
          status: 'APPROVED'
        }),
        finalReportFactory.create({ 
          studentId: student2.id, 
          vacancyId: vacancy.id, 
          cycleId: cycle.id, 
          fileId: file.id,
          status: 'APPROVED'
        }),
        finalReportFactory.create({ 
          studentId: student3.id, 
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

    it('Success get final reports with combined filters', async () => {
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
        finalReportFactory.create({ 
          studentId: student1.id, 
          vacancyId: vacancy.id, 
          cycleId: cycle1.id, 
          fileId: file.id,
          status: 'APPROVED'
        }),
        finalReportFactory.create({ 
          studentId: student1.id, 
          vacancyId: vacancy.id, 
          cycleId: cycle2.id, 
          fileId: file.id,
          status: 'APPROVED'
        }),
        finalReportFactory.create({ 
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

    it('Success get final reports with limit parameter', async () => {
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
      const student2 = await studentFactory.create({ careerId: career.id })
      const student3 = await studentFactory.create({ careerId: career.id })
      const student4 = await studentFactory.create({ careerId: career.id })
      const student5 = await studentFactory.create({ careerId: career.id })
      const vacancy = await vacancyFactory.create({ cycleId: cycle.id, departmentId: department.id })

      await Promise.all([
        finalReportFactory.create({ 
          studentId: student.id, 
          vacancyId: vacancy.id, 
          cycleId: cycle.id, 
          fileId: file.id 
        }),
        finalReportFactory.create({ 
          studentId: student2.id, 
          vacancyId: vacancy.id, 
          cycleId: cycle.id, 
          fileId: file.id 
        }),
        finalReportFactory.create({ 
          studentId: student3.id, 
          vacancyId: vacancy.id, 
          cycleId: cycle.id, 
          fileId: file.id 
        }),
        finalReportFactory.create({ 
          studentId: student4.id, 
          vacancyId: vacancy.id, 
          cycleId: cycle.id, 
          fileId: file.id 
        }),
        finalReportFactory.create({ 
          studentId: student5.id, 
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

    it('Success get final reports with limit and offset parameters', async () => {
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
      const student2 = await studentFactory.create({ careerId: career.id })
      const student3 = await studentFactory.create({ careerId: career.id })
      const student4 = await studentFactory.create({ careerId: career.id })
      const student5 = await studentFactory.create({ careerId: career.id })
      const vacancy = await vacancyFactory.create({ cycleId: cycle.id, departmentId: department.id })

      await Promise.all([
        finalReportFactory.create({ 
          studentId: student.id, 
          vacancyId: vacancy.id, 
          cycleId: cycle.id, 
          fileId: file.id 
        }),
        finalReportFactory.create({ 
          studentId: student2.id, 
          vacancyId: vacancy.id, 
          cycleId: cycle.id, 
          fileId: file.id 
        }),
        finalReportFactory.create({ 
          studentId: student3.id, 
          vacancyId: vacancy.id, 
          cycleId: cycle.id, 
          fileId: file.id 
        }),
        finalReportFactory.create({ 
          studentId: student4.id, 
          vacancyId: vacancy.id, 
          cycleId: cycle.id, 
          fileId: file.id 
        }),
        finalReportFactory.create({ 
          studentId: student5.id, 
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

    it('Success get final reports with order parameter', async () => {
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
      const student2 = await studentFactory.create({ careerId: career.id })
      const student3 = await studentFactory.create({ careerId: career.id })
      const vacancy = await vacancyFactory.create({ cycleId: cycle.id, departmentId: department.id })

      await Promise.all([
        finalReportFactory.create({ 
          studentId: student.id, 
          vacancyId: vacancy.id, 
          cycleId: cycle.id, 
          fileId: file.id 
        }),
        finalReportFactory.create({ 
          studentId: student2.id, 
          vacancyId: vacancy.id, 
          cycleId: cycle.id, 
          fileId: file.id 
        }),
        finalReportFactory.create({ 
          studentId: student3.id, 
          vacancyId: vacancy.id, 
          cycleId: cycle.id, 
          fileId: file.id 
        })
      ])

      const res = await app.inject({
        url: PATH,
        method: METHOD,
        query: {
          order: 'FinalReports.id'
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

      await finalReportFactory.create({ 
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

      await finalReportFactory.create({ 
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
      expect(typeof record.createdAt).toBe('string')
      expect(typeof record.updatedAt).toBe('string')
      expect(() => new Date(record.createdAt)).not.toThrow()
      expect(() => new Date(record.updatedAt)).not.toThrow()
      
      // Verify createdAt and updatedAt are formatted as ISO strings
      expect(record.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
      expect(record.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
    })

    it('Success get final reports with includeCycle parameter', async () => {
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
      const cycle = await cycleFactory.create({ slug: '2024A', isCurrent: true })
      const department = await departmentFactory.create()
      const career = await careerFactory.create()
      const file = await fileFactory.create()
      
      const student = await studentFactory.create({ careerId: career.id })
      const vacancy = await vacancyFactory.create({ cycleId: cycle.id, departmentId: department.id })

      await finalReportFactory.create({ 
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
          includeCycle: 'true'
        }
      })
      
      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.total).toBe(1)
      expect(body.records).toHaveLength(1)

      const record = body.records[0]
      
      // Verify cycle association is included
      expect(record).toHaveProperty('cycle')
      expect(record.cycle).toHaveProperty('id', cycle.id)
      expect(record.cycle).toHaveProperty('slug', cycle.slug)
      expect(record.cycle).toHaveProperty('isCurrent', cycle.isCurrent)
      expect(record.cycle).toHaveProperty('createdAt')
      expect(record.cycle).toHaveProperty('updatedAt')
      
      // Verify other associations are not included
      expect(record).not.toHaveProperty('student')
      expect(record).not.toHaveProperty('vacancy')
    })

    it('Success get final reports with includeStudent parameter', async () => {
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
      
      const student = await studentFactory.create({ 
        careerId: career.id,
        name: 'John Doe',
        code: 'ST001',
        email: 'john@example.com',
        telephone: '123456789'
      })
      const vacancy = await vacancyFactory.create({ cycleId: cycle.id, departmentId: department.id })

      await finalReportFactory.create({ 
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
          includeStudent: 'true'
        }
      })
      
      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.total).toBe(1)
      expect(body.records).toHaveLength(1)

      const record = body.records[0]
      
      // Verify student association is included
      expect(record).toHaveProperty('student')
      expect(record.student).toHaveProperty('id', student.id)
      expect(record.student).toHaveProperty('name', student.name)
      expect(record.student).toHaveProperty('code', student.code)
      expect(record.student).toHaveProperty('careerId', student.careerId)
      expect(record.student).toHaveProperty('email', student.email)
      expect(record.student).toHaveProperty('telephone', student.telephone)
      expect(record.student).toHaveProperty('createdAt')
      expect(record.student).toHaveProperty('updatedAt')
      
      // Verify other associations are not included
      expect(record).not.toHaveProperty('cycle')
      expect(record).not.toHaveProperty('vacancy')
    })

    it('Success get final reports with includeVacancy parameter', async () => {
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
      const vacancy = await vacancyFactory.create({ 
        cycleId: cycle.id, 
        departmentId: department.id,
        name: 'Software Developer Internship',
        description: 'Full-stack development position',
        slots: 5,
        disabled: false
      })

      await finalReportFactory.create({ 
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
          includeVacancy: 'true'
        }
      })
      
      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.total).toBe(1)
      expect(body.records).toHaveLength(1)

      const record = body.records[0]
      
      // Verify vacancy association is included
      expect(record).toHaveProperty('vacancy')
      expect(record.vacancy).toHaveProperty('id', vacancy.id)
      expect(record.vacancy).toHaveProperty('name', vacancy.name)
      expect(record.vacancy).toHaveProperty('description', vacancy.description)
      expect(record.vacancy).toHaveProperty('slots', vacancy.slots)
      expect(record.vacancy).toHaveProperty('cycleId', vacancy.cycleId)
      expect(record.vacancy).toHaveProperty('departmentId', vacancy.departmentId)
      expect(record.vacancy).toHaveProperty('disabled', vacancy.disabled)
      expect(record.vacancy).toHaveProperty('createdAt')
      expect(record.vacancy).toHaveProperty('updatedAt')
      
      // Verify other associations are not included
      expect(record).not.toHaveProperty('cycle')
      expect(record).not.toHaveProperty('student')
    })

    it('Success get final reports with multiple include parameters', async () => {
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
      const cycle = await cycleFactory.create({ slug: '2024A', isCurrent: true })
      const department = await departmentFactory.create()
      const career = await careerFactory.create()
      const file = await fileFactory.create()
      
      const student = await studentFactory.create({ 
        careerId: career.id,
        name: 'Jane Smith',
        code: 'ST002'
      })
      const vacancy = await vacancyFactory.create({ 
        cycleId: cycle.id, 
        departmentId: department.id,
        name: 'Data Analyst Internship',
        slots: 3
      })

      await finalReportFactory.create({ 
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
          includeCycle: 'true',
          includeStudent: 'true',
          includeVacancy: 'true'
        }
      })
      
      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.total).toBe(1)
      expect(body.records).toHaveLength(1)

      const record = body.records[0]
      
      // Verify all associations are included
      expect(record).toHaveProperty('cycle')
      expect(record.cycle).toHaveProperty('id', cycle.id)
      expect(record.cycle).toHaveProperty('slug', cycle.slug)
      
      expect(record).toHaveProperty('student')
      expect(record.student).toHaveProperty('id', student.id)
      expect(record.student).toHaveProperty('name', student.name)
      expect(record.student).toHaveProperty('code', student.code)
      
      expect(record).toHaveProperty('vacancy')
      expect(record.vacancy).toHaveProperty('id', vacancy.id)
      expect(record.vacancy).toHaveProperty('name', vacancy.name)
      expect(record.vacancy).toHaveProperty('slots', vacancy.slots)
      
      // Verify date formatting for all associations
      expect(typeof record.cycle.createdAt).toBe('string')
      expect(typeof record.cycle.updatedAt).toBe('string')
      expect(typeof record.student.createdAt).toBe('string')
      expect(typeof record.student.updatedAt).toBe('string')
      expect(typeof record.vacancy.createdAt).toBe('string')
      expect(typeof record.vacancy.updatedAt).toBe('string')
    })

    it('Success get final reports without include parameters should not return associations', async () => {
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

      await finalReportFactory.create({ 
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
      expect(body.total).toBe(1)
      expect(body.records).toHaveLength(1)

      const record = body.records[0]
      
      // Verify no associations are included
      expect(record).not.toHaveProperty('cycle')
      expect(record).not.toHaveProperty('student')
      expect(record).not.toHaveProperty('vacancy')
      
      // Verify basic fields are still present
      expect(record).toHaveProperty('id')
      expect(record).toHaveProperty('studentId')
      expect(record).toHaveProperty('vacancyId')
      expect(record).toHaveProperty('cycleId')
      expect(record).toHaveProperty('status')
      expect(record).toHaveProperty('hours')
      expect(record).toHaveProperty('fileId')
      expect(record).toHaveProperty('createdAt')
      expect(record).toHaveProperty('updatedAt')
    })
  })

  describe('PATCH /final-reports/:id', () => {
    const METHOD = 'PATCH'

    it('Success update final report status from PENDING to APPROVED', async () => {
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

      const finalReport = await finalReportFactory.create({ 
        studentId: student.id, 
        vacancyId: vacancy.id, 
        cycleId: cycle.id, 
        fileId: file.id,
        status: 'PENDING'
      })

      const res = await app.inject({
        url: `/final-reports/${finalReport.id}`,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        },
        payload: {
          status: 'APPROVED'
        }
      })
      
      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body).toHaveProperty('id', finalReport.id)
      expect(body).toHaveProperty('status', 'APPROVED')
      expect(body).toHaveProperty('studentId', student.id)
      expect(body).toHaveProperty('vacancyId', vacancy.id)
      expect(body).toHaveProperty('cycleId', cycle.id)
      expect(body).toHaveProperty('fileId', file.id)
      expect(body).toHaveProperty('hours')
      expect(body).toHaveProperty('createdAt')
      expect(body).toHaveProperty('updatedAt')
      
      // Verify updatedAt has changed
      expect(new Date(body.updatedAt).getTime()).toBeGreaterThan(new Date(finalReport.updatedAt).getTime())
    })

    it('Success update final report status from PENDING to REJECTED', async () => {
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

      const finalReport = await finalReportFactory.create({ 
        studentId: student.id, 
        vacancyId: vacancy.id, 
        cycleId: cycle.id, 
        fileId: file.id,
        status: 'PENDING'
      })

      const res = await app.inject({
        url: `/final-reports/${finalReport.id}`,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        },
        payload: {
          status: 'REJECTED'
        }
      })
      
      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body).toHaveProperty('id', finalReport.id)
      expect(body).toHaveProperty('status', 'REJECTED')
      expect(body).toHaveProperty('studentId', student.id)
      expect(body).toHaveProperty('vacancyId', vacancy.id)
      expect(body).toHaveProperty('cycleId', cycle.id)
      expect(body).toHaveProperty('fileId', file.id)
    })

    it('Returns 409 when trying to update status from APPROVED', async () => {
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

      const finalReport = await finalReportFactory.create({ 
        studentId: student.id, 
        vacancyId: vacancy.id, 
        cycleId: cycle.id, 
        fileId: file.id,
        status: 'APPROVED'
      })

      const res = await app.inject({
        url: `/final-reports/${finalReport.id}`,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        },
        payload: {
          status: 'REJECTED'
        }
      })
      
      expect(res.statusCode).toBe(409)
      const body = res.json()
      expect(body).toHaveProperty('message', 'Cannot change status. Only PENDING status can be changed to APPROVED or REJECTED.')
    })

    it('Returns 409 when trying to update status from REJECTED', async () => {
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

      const finalReport = await finalReportFactory.create({ 
        studentId: student.id, 
        vacancyId: vacancy.id, 
        cycleId: cycle.id, 
        fileId: file.id,
        status: 'REJECTED'
      })

      const res = await app.inject({
        url: `/final-reports/${finalReport.id}`,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        },
        payload: {
          status: 'APPROVED'
        }
      })
      
      expect(res.statusCode).toBe(409)
      const body = res.json()
      expect(body).toHaveProperty('message', 'Cannot change status. Only PENDING status can be changed to APPROVED or REJECTED.')
    })

    it('Returns 404 when final report does not exist', async () => {
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
        url: '/final-reports/99999',
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        },
        payload: {
          status: 'APPROVED'
        }
      })
      
      expect(res.statusCode).toBe(404)
      const body = res.json()
      expect(body).toHaveProperty('message', 'Final report not found')
    })

    it('Returns 400 when no authorization token provided', async () => {
      const res = await app.inject({
        url: '/final-reports/1',
        method: METHOD,
        payload: {
          status: 'APPROVED'
        }
      })
      
      expect(res.statusCode).toBe(400)
      const body = res.json()
      expect(body).toHaveProperty('message', 'headers must have required property \'authorization\'')
    })

    it('Returns 403 when user lacks EDIT_STUDENT permission', async () => {
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
        url: '/final-reports/1',
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        },
        payload: {
          status: 'APPROVED'
        }
      })
      
      expect(res.statusCode).toBe(403)
    })

    it('Returns 400 when status is not provided in body', async () => {
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
        url: '/final-reports/1',
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        },
        payload: {}
      })
      
      expect(res.statusCode).toBe(400)
      const body = res.json()
      expect(body).toHaveProperty('message')
      expect(body.message).toContain('must have required property \'status\'')
    })

    it('Returns 400 when status is invalid', async () => {
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
        url: '/final-reports/1',
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        },
        payload: {
          status: 'PENDING'
        }
      })
      
      expect(res.statusCode).toBe(400)
      const body = res.json()
      expect(body).toHaveProperty('message')
      expect(body.message).toContain('must be equal to one of the allowed values')
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

      const finalReport = await finalReportFactory.create({ 
        studentId: student.id, 
        vacancyId: vacancy.id, 
        cycleId: cycle.id, 
        fileId: file.id,
        status: 'PENDING'
      })

      const res = await app.inject({
        url: `/final-reports/${finalReport.id}`,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        },
        payload: {
          status: 'APPROVED'
        }
      })
      
      expect(res.statusCode).toBe(200)
      const body = res.json()
      
      // Verify dates are formatted correctly
      expect(typeof body.createdAt).toBe('string')
      expect(typeof body.updatedAt).toBe('string')
      expect(() => new Date(body.createdAt)).not.toThrow()
      expect(() => new Date(body.updatedAt)).not.toThrow()
      
      // Verify createdAt and updatedAt are formatted as ISO strings
      expect(body.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
      expect(body.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
    })
  })
})
