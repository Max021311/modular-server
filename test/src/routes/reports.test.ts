import { describe, beforeAll, afterAll, expect } from 'vitest'
import { isolatedIt as it } from '#test/utils/isolatedIt.js'
import build from '#src/build.js'
import { userFactory } from '#test/utils/factories/user.js'
import { reportFactory } from '#test/utils/factories/report.js'
import { fileFactory } from '#test/utils/factories/file.js'
import { cycleFactory } from '#test/utils/factories/cycle.js'
import { studentFactory } from '#test/utils/factories/student.js'
import { careerFactory } from '#test/utils/factories/career.js'
import { vacancyFactory } from '#test/utils/factories/vacancy.js'
import { departmentFactory } from '#test/utils/factories/department.js'
import { faker } from '@faker-js/faker'
import configuration from '#src/common/configuration.js'
import { JwtService } from '#src/service/jwt/index.js'

describe('Reports API', () => {
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

  describe('GET /reports', () => {
    const PATH = '/reports'
    const METHOD = 'GET'

    it('Success get reports returns total count and records', async () => {
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
      const file2 = await fileFactory.create()
      
      const student = await studentFactory.create({ careerId: career.id })
      const vacancy = await vacancyFactory.create({ cycleId: cycle.id, departmentId: department.id })

      await Promise.all([
        reportFactory.create({ 
          studentId: student.id, 
          vacancyId: vacancy.id, 
          reportNumber: '1',
          cycleId: cycle.id, 
          fileId: file.id 
        }),
        reportFactory.create({ 
          studentId: student.id, 
          vacancyId: vacancy.id, 
          reportNumber: '2',
          cycleId: cycle.id, 
          fileId: file2.id 
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
      expect(body.total).toBe(2)
      expect(body.records).toBeInstanceOf(Array)

      const record = body.records[0]
      expect(record).toHaveProperty('id')
      expect(record).toHaveProperty('studentId')
      expect(record).toHaveProperty('vacancyId')
      expect(record).toHaveProperty('cycleId')
      expect(record).toHaveProperty('reportNumber')
      expect(record).toHaveProperty('status')
      expect(record).toHaveProperty('hours')
      expect(record).toHaveProperty('fileId')
      expect(record).toHaveProperty('createdAt')
      expect(record).toHaveProperty('updatedAt')
    })

    it('Success get reports filtered by cycleId', async () => {
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
      const file2 = await fileFactory.create()
      const file3 = await fileFactory.create()
      
      const student = await studentFactory.create({ careerId: career.id })
      const vacancy = await vacancyFactory.create({ cycleId: cycle1.id, departmentId: department.id })
      const vacancy2 = await vacancyFactory.create({ cycleId: cycle2.id, departmentId: department.id })

      await Promise.all([
        reportFactory.create({ 
          studentId: student.id, 
          vacancyId: vacancy.id, 
          cycleId: cycle1.id, 
          reportNumber: '1',
          fileId: file.id 
        }),
        reportFactory.create({ 
          studentId: student.id, 
          vacancyId: vacancy.id, 
          cycleId: cycle1.id, 
          reportNumber: '2',
          fileId: file2.id 
        }),
        reportFactory.create({ 
          studentId: student.id, 
          vacancyId: vacancy2.id, 
          reportNumber: '2',
          cycleId: cycle2.id, 
          fileId: file3.id 
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

    it('Success get reports filtered by reportNumber', async () => {
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
        reportFactory.create({ 
          studentId: student.id, 
          vacancyId: vacancy.id, 
          cycleId: cycle.id, 
          fileId: file.id,
          reportNumber: '1'
        }),
        reportFactory.create({ 
          studentId: student.id, 
          vacancyId: vacancy.id, 
          cycleId: cycle.id, 
          fileId: file.id,
          reportNumber: '2'
        })
      ])

      const res = await app.inject({
        url: PATH,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        },
        query: {
          reportNumber: '1'
        }
      })
      
      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.total).toBe(1)
      expect(body.records).toHaveLength(1)

      // All records should have the same reportNumber
      body.records.forEach((record: any) => {
        expect(record.reportNumber).toBe('1')
      })
    })

    it('Success get reports filtered by status', async () => {
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
        reportFactory.create({ 
          studentId: student.id, 
          vacancyId: vacancy.id, 
          cycleId: cycle.id, 
          fileId: file.id,
          reportNumber: '1',
          status: 'APPROVED'
        }),
        reportFactory.create({ 
          studentId: student.id, 
          vacancyId: vacancy.id, 
          cycleId: cycle.id, 
          fileId: file.id,
          reportNumber: '2',
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

    it('Success get reports with combined filters', async () => {
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
        reportFactory.create({ 
          studentId: student1.id, 
          vacancyId: vacancy.id, 
          cycleId: cycle1.id, 
          fileId: file.id,
          reportNumber: '1',
          status: 'APPROVED'
        }),
        reportFactory.create({ 
          studentId: student1.id, 
          vacancyId: vacancy.id, 
          cycleId: cycle2.id, 
          fileId: file.id,
          reportNumber: '1',
          status: 'APPROVED'
        }),
        reportFactory.create({ 
          studentId: student2.id, 
          vacancyId: vacancy.id, 
          cycleId: cycle1.id, 
          fileId: file.id,
          reportNumber: '1',
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
          reportNumber: '1',
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
      expect(record.reportNumber).toBe('1')
      expect(record.status).toBe('APPROVED')
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
  })

  describe('PATCH /reports/:id', () => {
    const METHOD = 'PATCH'

    it('Success update report status from PENDING to APPROVED', async () => {
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

      const report = await reportFactory.create({ 
        studentId: student.id, 
        vacancyId: vacancy.id, 
        cycleId: cycle.id, 
        fileId: file.id,
        status: 'PENDING'
      })

      const res = await app.inject({
        url: `/reports/${report.id}`,
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
      expect(body).toHaveProperty('id', report.id)
      expect(body).toHaveProperty('status', 'APPROVED')
      expect(body).toHaveProperty('studentId', student.id)
      expect(body).toHaveProperty('vacancyId', vacancy.id)
      expect(body).toHaveProperty('cycleId', cycle.id)
      expect(body).toHaveProperty('fileId', file.id)
      expect(body).toHaveProperty('reportNumber')
      expect(body).toHaveProperty('hours')
      expect(body).toHaveProperty('createdAt')
      expect(body).toHaveProperty('updatedAt')
      
      // Verify updatedAt has changed
      expect(new Date(body.updatedAt).getTime()).toBeGreaterThan(new Date(report.updatedAt).getTime())
    })

    it('Success update report status from PENDING to REJECTED', async () => {
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

      const report = await reportFactory.create({ 
        studentId: student.id, 
        vacancyId: vacancy.id, 
        cycleId: cycle.id, 
        fileId: file.id,
        status: 'PENDING'
      })

      const res = await app.inject({
        url: `/reports/${report.id}`,
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
      expect(body).toHaveProperty('id', report.id)
      expect(body).toHaveProperty('status', 'REJECTED')
      expect(body).toHaveProperty('studentId', student.id)
      expect(body).toHaveProperty('vacancyId', vacancy.id)
      expect(body).toHaveProperty('cycleId', cycle.id)
      expect(body).toHaveProperty('fileId', file.id)
      expect(body).toHaveProperty('reportNumber')
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

      const report = await reportFactory.create({ 
        studentId: student.id, 
        vacancyId: vacancy.id, 
        cycleId: cycle.id, 
        fileId: file.id,
        status: 'APPROVED'
      })

      const res = await app.inject({
        url: `/reports/${report.id}`,
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

    it('Returns 404 when report does not exist', async () => {
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
        url: '/reports/99999',
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
      expect(body).toHaveProperty('message', 'Report not found')
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
        url: '/reports/1',
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
  })

  describe('GET /reports/:id/download', () => {
    const METHOD = 'GET'

    it('Success download report file', async () => {
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
      const file = await fileFactory.create({
        name: 'test-report.pdf',
        url: 'https://httpbin.org/base64/SFRUUEJJTiBpcyBhd2Vzb21l'
      })
      
      const student = await studentFactory.create({ careerId: career.id })
      const vacancy = await vacancyFactory.create({ cycleId: cycle.id, departmentId: department.id })

      const report = await reportFactory.create({ 
        studentId: student.id, 
        vacancyId: vacancy.id, 
        cycleId: cycle.id, 
        fileId: file.id,
        status: 'APPROVED'
      })

      const res = await app.inject({
        url: `/reports/${report.id}/download`,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        }
      })
      
      expect(res.statusCode).toBe(200)
      expect(res.headers['content-disposition']).toContain('attachment')
      expect(res.headers['content-disposition']).toContain(file.name)
      expect(res.headers['content-type']).toBe('application/octet-stream')
    })

    it('Returns 404 when report does not exist', async () => {
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
        url: '/reports/99999/download',
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        }
      })
      
      expect(res.statusCode).toBe(404)
      const body = res.json()
      expect(body).toHaveProperty('message', 'Report not found')
    })

    it('Returns 404 when file does not exist', async () => {
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

      // Create test data with non-existent file
      const cycle = await cycleFactory.create()
      const department = await departmentFactory.create()
      const career = await careerFactory.create()
      
      const student = await studentFactory.create({ careerId: career.id })
      const vacancy = await vacancyFactory.create({ cycleId: cycle.id, departmentId: department.id })

      const report = await reportFactory.create({ 
        studentId: student.id, 
        vacancyId: vacancy.id, 
        cycleId: cycle.id, 
        fileId: 99999, // Non-existent file ID
        status: 'APPROVED'
      })

      const res = await app.inject({
        url: `/reports/${report.id}/download`,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        }
      })
      
      expect(res.statusCode).toBe(404)
      const body = res.json()
      expect(body).toHaveProperty('message', 'File not found')
    })

    it('Returns 403 when user lacks VIEW_REPORT permission', async () => {
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
        url: '/reports/1/download',
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        }
      })
      
      expect(res.statusCode).toBe(403)
    })
  })
})
