import { describe, beforeAll, afterAll, expect } from 'vitest'
import { isolatedIt as it } from '#test/utils/isolatedIt.js'
import build from '#src/build.js'
import { cycleFactory } from '#test/utils/factories/cycle.js'
import { studentFactory } from '#test/utils/factories/student.js'
import { JwtService } from '#src/service/jwt/index.js'
import configuration from '#src/common/configuration.js'
import { careerFactory } from '#test/utils/factories/career.js'
import { vacancyFactory } from '#test/utils/factories/vacancy.js'
import { departmentFactory } from '#test/utils/factories/department.js'
import { reportFactory } from '#test/utils/factories/report.js'
import { fileFactory } from '#test/utils/factories/file.js'
import { userFactory } from '#test/utils/factories/user.js'
import { vacancyToStudentFactory } from '#test/utils/factories/vacancy-to-student.js'
import FormData from 'form-data'

describe('Student Reports API', () => {
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

  describe('GET /api/student/reports', () => {
    const PATH = '/api/student/reports'
    const METHOD = 'GET'
    
    it('Successfully returns single report for student and vacancy', async () => {
      // Create test data
      const cycle = await cycleFactory.create()
      const department = await departmentFactory.create()
      const vacancy = await vacancyFactory.create({ 
        cycleId: cycle.id, 
        departmentId: department.id 
      })
      
      const career = await careerFactory.create()
      const student = await studentFactory.create({ careerId: career.id })
      const file = await fileFactory.create()
      
      const report = await reportFactory.create({
        studentId: student.id,
        vacancyId: vacancy.id,
        cycleId: cycle.id,
        fileId: file.id,
        reportNumber: '1',
        status: 'PENDING',
        hours: 120
      })

      const token = await jwtService.sign({
        id: student.id,
        name: student.name,
        code: student.code,
        careerId: student.careerId,
        email: student.email,
        telephone: student.telephone,
        createdAt: student.createdAt,
        updatedAt: student.updatedAt,
        scope: 'student'
      })

      const res = await app.inject({
        url: PATH,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        },
        query: {
          vacancyId: vacancy.id.toString()
        }
      })

      expect(res.statusCode).toBe(200)
      const body = res.json()
      
      expect(Array.isArray(body)).toBe(true)
      expect(body).toHaveLength(1)
      
      const reportResponse = body[0]
      expect(reportResponse).toHaveProperty('id', report.id)
      expect(reportResponse).toHaveProperty('studentId', student.id)
      expect(reportResponse).toHaveProperty('vacancyId', vacancy.id)
      expect(reportResponse).toHaveProperty('cycleId', cycle.id)
      expect(reportResponse).toHaveProperty('reportNumber', '1')
      expect(reportResponse).toHaveProperty('status', 'PENDING')
      expect(reportResponse).toHaveProperty('fileId', file.id)
      expect(reportResponse).toHaveProperty('hours', 120)
      expect(reportResponse).toHaveProperty('createdAt')
      expect(reportResponse).toHaveProperty('updatedAt')
      
      // Should not include cycle by default
      expect(reportResponse.cycle).toBeUndefined()
      expect(reportResponse.student).toBeUndefined()
      expect(reportResponse.vacancy).toBeUndefined()
    })

    it('Successfully returns both reports for student and vacancy', async () => {
      // Create test data
      const cycle = await cycleFactory.create()
      const department = await departmentFactory.create()
      const vacancy = await vacancyFactory.create({ 
        cycleId: cycle.id, 
        departmentId: department.id 
      })
      
      const career = await careerFactory.create()
      const student = await studentFactory.create({ careerId: career.id })
      const file1 = await fileFactory.create()
      const file2 = await fileFactory.create()
      
      const report1 = await reportFactory.create({
        studentId: student.id,
        vacancyId: vacancy.id,
        cycleId: cycle.id,
        fileId: file1.id,
        reportNumber: '1',
        status: 'APPROVED',
        hours: 150
      })

      const report2 = await reportFactory.create({
        studentId: student.id,
        vacancyId: vacancy.id,
        cycleId: cycle.id,
        fileId: file2.id,
        reportNumber: '2',
        status: 'PENDING',
        hours: 175
      })

      const token = await jwtService.sign({
        id: student.id,
        name: student.name,
        code: student.code,
        careerId: student.careerId,
        email: student.email,
        telephone: student.telephone,
        createdAt: student.createdAt,
        updatedAt: student.updatedAt,
        scope: 'student'
      })

      const res = await app.inject({
        url: PATH,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        },
        query: {
          vacancyId: vacancy.id.toString()
        }
      })

      expect(res.statusCode).toBe(200)
      const body = res.json()
      
      expect(Array.isArray(body)).toBe(true)
      expect(body).toHaveLength(2)
      
      // Find reports by reportNumber for assertion
      // @ts-expect-error body is not typed correctly
      const report1Response = body.find(r => r.reportNumber === '1')
      // @ts-expect-error body is not typed correctly
      const report2Response = body.find(r => r.reportNumber === '2')
      
      expect(report1Response).toHaveProperty('id', report1.id)
      expect(report1Response).toHaveProperty('status', 'APPROVED')
      expect(report1Response).toHaveProperty('hours', 150)
      
      expect(report2Response).toHaveProperty('id', report2.id)
      expect(report2Response).toHaveProperty('status', 'PENDING')
      expect(report2Response).toHaveProperty('hours', 175)
    })

    it('Successfully returns reports with cycle when includeCycle=true', async () => {
      // Create test data
      const cycle = await cycleFactory.create({ 
        slug: '2024A', 
        isCurrent: true 
      })
      const department = await departmentFactory.create()
      const vacancy = await vacancyFactory.create({ 
        cycleId: cycle.id, 
        departmentId: department.id 
      })
      
      const career = await careerFactory.create()
      const student = await studentFactory.create({ careerId: career.id })
      const file = await fileFactory.create()
      
      const report = await reportFactory.create({
        studentId: student.id,
        vacancyId: vacancy.id,
        cycleId: cycle.id,
        fileId: file.id,
        reportNumber: '1',
        status: 'REJECTED',
        hours: 200
      })

      const token = await jwtService.sign({
        id: student.id,
        name: student.name,
        code: student.code,
        careerId: student.careerId,
        email: student.email,
        telephone: student.telephone,
        createdAt: student.createdAt,
        updatedAt: student.updatedAt,
        scope: 'student'
      })

      const res = await app.inject({
        url: PATH,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        },
        query: {
          vacancyId: vacancy.id.toString(),
          includeCycle: 'true'
        }
      })

      expect(res.statusCode).toBe(200)
      const body = res.json()
      
      expect(Array.isArray(body)).toBe(true)
      expect(body).toHaveLength(1)
      
      const reportResponse = body[0]
      expect(reportResponse).toHaveProperty('id', report.id)
      expect(reportResponse).toHaveProperty('status', 'REJECTED')
      expect(reportResponse).toHaveProperty('hours', 200)
      
      // Should include cycle information
      expect(reportResponse).toHaveProperty('cycle')
      expect(reportResponse.cycle).toHaveProperty('id', cycle.id)
      expect(reportResponse.cycle).toHaveProperty('slug', '2024A')
      expect(reportResponse.cycle).toHaveProperty('isCurrent', true)
      expect(reportResponse.cycle).toHaveProperty('createdAt')
      expect(reportResponse.cycle).toHaveProperty('updatedAt')
      
      // Should still not include student and vacancy
      expect(reportResponse.student).toBeUndefined()
      expect(reportResponse.vacancy).toBeUndefined()
    })

    it('Returns 404 when no reports exist for student and vacancy', async () => {
      const cycle = await cycleFactory.create()
      const department = await departmentFactory.create()
      const vacancy = await vacancyFactory.create({ 
        cycleId: cycle.id, 
        departmentId: department.id 
      })
      
      const career = await careerFactory.create()
      const student = await studentFactory.create({ careerId: career.id })

      const token = await jwtService.sign({
        id: student.id,
        name: student.name,
        code: student.code,
        careerId: student.careerId,
        email: student.email,
        telephone: student.telephone,
        createdAt: student.createdAt,
        updatedAt: student.updatedAt,
        scope: 'student'
      })

      const res = await app.inject({
        url: PATH,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        },
        query: {
          vacancyId: vacancy.id.toString()
        }
      })

      expect(res.statusCode).toBe(404)
      const body = res.json()
      expect(body).toHaveProperty('message', 'Reports not found for this student and vacancy')
    })

    it('Returns 404 when reports exist but for different student', async () => {
      // Create test data
      const cycle = await cycleFactory.create()
      const department = await departmentFactory.create()
      const vacancy = await vacancyFactory.create({ 
        cycleId: cycle.id, 
        departmentId: department.id 
      })
      
      const career = await careerFactory.create()
      const student1 = await studentFactory.create({ careerId: career.id })
      const student2 = await studentFactory.create({ careerId: career.id })
      const file = await fileFactory.create()
      
      // Create reports for student1
      await reportFactory.create({
        studentId: student1.id,
        vacancyId: vacancy.id,
        cycleId: cycle.id,
        fileId: file.id,
        reportNumber: '1',
        status: 'PENDING',
        hours: 160
      })

      // Try to access with student2's token
      const token = await jwtService.sign({
        id: student2.id,
        name: student2.name,
        code: student2.code,
        careerId: student2.careerId,
        email: student2.email,
        telephone: student2.telephone,
        createdAt: student2.createdAt,
        updatedAt: student2.updatedAt,
        scope: 'student'
      })

      const res = await app.inject({
        url: PATH,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        },
        query: {
          vacancyId: vacancy.id.toString()
        }
      })

      expect(res.statusCode).toBe(404)
      const body = res.json()
      expect(body).toHaveProperty('message', 'Reports not found for this student and vacancy')
    })

    it('Returns 400 when vacancyId is missing', async () => {
      const career = await careerFactory.create()
      const student = await studentFactory.create({ careerId: career.id })

      const token = await jwtService.sign({
        id: student.id,
        name: student.name,
        code: student.code,
        careerId: student.careerId,
        email: student.email,
        telephone: student.telephone,
        createdAt: student.createdAt,
        updatedAt: student.updatedAt,
        scope: 'student'
      })

      const res = await app.inject({
        url: PATH,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        }
        // Missing vacancyId query parameter
      })

      expect(res.statusCode).toBe(400)
    })

    it('Returns 400 when vacancyId is not a valid integer', async () => {
      const career = await careerFactory.create()
      const student = await studentFactory.create({ careerId: career.id })

      const token = await jwtService.sign({
        id: student.id,
        name: student.name,
        code: student.code,
        careerId: student.careerId,
        email: student.email,
        telephone: student.telephone,
        createdAt: student.createdAt,
        updatedAt: student.updatedAt,
        scope: 'student'
      })

      const res = await app.inject({
        url: PATH,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        },
        query: {
          vacancyId: 'invalid-id'
        }
      })

      expect(res.statusCode).toBe(400)
    })

    it('Returns 400 when no authorization token provided', async () => {
      const res = await app.inject({
        url: PATH,
        method: METHOD,
        query: {
          vacancyId: '123'
        }
      })

      expect(res.statusCode).toBe(400)
      const body = res.json()
      expect(body).toHaveProperty('message', 'headers must have required property \'authorization\'')
    })

    it('Returns 401 when invalid token provided', async () => {
      const res = await app.inject({
        url: PATH,
        method: METHOD,
        headers: {
          authorization: 'Bearer invalid-token'
        },
        query: {
          vacancyId: '123'
        }
      })

      expect(res.statusCode).toBe(400)
    })

    it('Returns 401 when token has wrong scope (user instead of student)', async () => {
      const career = await careerFactory.create()
      const user = await userFactory.create()

      // Create token with 'user' scope instead of 'student'
      const token = await jwtService.sign({
        id: user.id,
        user: user.user,
        name: user.name,
        role: user.role,
        permissions: user.permissions,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        scope: 'user' // Wrong scope
      })

      const res = await app.inject({
        url: PATH,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        },
        query: {
          vacancyId: '123'
        }
      })

      expect(res.statusCode).toBe(401)
    })

    it('Correctly formats dates in response', async () => {
      const cycle = await cycleFactory.create()
      const department = await departmentFactory.create()
      const vacancy = await vacancyFactory.create({ 
        cycleId: cycle.id, 
        departmentId: department.id 
      })
      
      const career = await careerFactory.create()
      const student = await studentFactory.create({ careerId: career.id })
      const file = await fileFactory.create()
      
      const report = await reportFactory.create({
        studentId: student.id,
        vacancyId: vacancy.id,
        cycleId: cycle.id,
        fileId: file.id,
        reportNumber: '2',
        status: 'APPROVED',
        hours: 300
      })

      const token = await jwtService.sign({
        id: student.id,
        name: student.name,
        code: student.code,
        careerId: student.careerId,
        email: student.email,
        telephone: student.telephone,
        createdAt: student.createdAt,
        updatedAt: student.updatedAt,
        scope: 'student'
      })

      const res = await app.inject({
        url: PATH,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        },
        query: {
          vacancyId: vacancy.id.toString(),
          includeCycle: 'true'
        }
      })

      expect(res.statusCode).toBe(200)
      const body = res.json()
      
      expect(Array.isArray(body)).toBe(true)
      expect(body).toHaveLength(1)
      
      const reportResponse = body[0]
      
      // Check date formatting
      expect(reportResponse.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/) // ISO datetime
      expect(reportResponse.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/) // ISO datetime
      
      // Check cycle dates when included
      expect(reportResponse.cycle.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
      expect(reportResponse.cycle.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
    })

    it('Returns correct reportNumber values', async () => {
      const cycle = await cycleFactory.create()
      const department = await departmentFactory.create()
      const vacancy = await vacancyFactory.create({ 
        cycleId: cycle.id, 
        departmentId: department.id 
      })
      
      const career = await careerFactory.create()
      const student = await studentFactory.create({ careerId: career.id })
      const file1 = await fileFactory.create()
      const file2 = await fileFactory.create()
      
      await reportFactory.create({
        studentId: student.id,
        vacancyId: vacancy.id,
        cycleId: cycle.id,
        fileId: file1.id,
        reportNumber: '1',
        status: 'APPROVED',
        hours: 100
      })

      await reportFactory.create({
        studentId: student.id,
        vacancyId: vacancy.id,
        cycleId: cycle.id,
        fileId: file2.id,
        reportNumber: '2',
        status: 'PENDING',
        hours: 200
      })

      const token = await jwtService.sign({
        id: student.id,
        name: student.name,
        code: student.code,
        careerId: student.careerId,
        email: student.email,
        telephone: student.telephone,
        createdAt: student.createdAt,
        updatedAt: student.updatedAt,
        scope: 'student'
      })

      const res = await app.inject({
        url: PATH,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        },
        query: {
          vacancyId: vacancy.id.toString()
        }
      })

      expect(res.statusCode).toBe(200)
      const body = res.json()
      
      expect(Array.isArray(body)).toBe(true)
      expect(body).toHaveLength(2)
      
      // @ts-expect-error body is not typed correctly
      const reportNumbers = body.map(r => r.reportNumber).sort()
      expect(reportNumbers).toEqual(['1', '2'])
      
      // Verify each report has correct data
      // @ts-expect-error body is not typed correctly
      body.forEach(report => {
        expect(['1', '2']).toContain(report.reportNumber)
        expect(report).toHaveProperty('studentId', student.id)
        expect(report).toHaveProperty('vacancyId', vacancy.id)
        expect(['APPROVED', 'PENDING']).toContain(report.status)
      })
    })

    it('Respects maximum limit of 2 reports', async () => {
      const cycle = await cycleFactory.create()
      const department = await departmentFactory.create()
      const vacancy = await vacancyFactory.create({ 
        cycleId: cycle.id, 
        departmentId: department.id 
      })
      
      const career = await careerFactory.create()
      const student = await studentFactory.create({ careerId: career.id })
      const file1 = await fileFactory.create()
      const file2 = await fileFactory.create()
      
      await reportFactory.create({
        studentId: student.id,
        vacancyId: vacancy.id,
        cycleId: cycle.id,
        fileId: file1.id,
        reportNumber: '1',
        status: 'APPROVED',
        hours: 80
      })

      await reportFactory.create({
        studentId: student.id,
        vacancyId: vacancy.id,
        cycleId: cycle.id,
        fileId: file2.id,
        reportNumber: '2',
        status: 'REJECTED',
        hours: 120
      })

      const token = await jwtService.sign({
        id: student.id,
        name: student.name,
        code: student.code,
        careerId: student.careerId,
        email: student.email,
        telephone: student.telephone,
        createdAt: student.createdAt,
        updatedAt: student.updatedAt,
        scope: 'student'
      })

      const res = await app.inject({
        url: PATH,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        },
        query: {
          vacancyId: vacancy.id.toString()
        }
      })

      expect(res.statusCode).toBe(200)
      const body = res.json()
      
      expect(Array.isArray(body)).toBe(true)
      expect(body).toHaveLength(2) // Maximum 2 reports as per constraint
      
      // Verify we have both report numbers
      // @ts-expect-error body is not typed correctly
      const reportNumbers = body.map(r => r.reportNumber).sort()
      expect(reportNumbers).toEqual(['1', '2'])
    })
  })

  describe('POST /api/student/reports', () => {
    const PATH = '/api/student/reports'
    const METHOD = 'POST'
    
    it('Successfully creates a new report with file upload when student is associated with vacancy', async () => {
      // Create test data
      const cycle = await cycleFactory.create()
      const department = await departmentFactory.create()
      const vacancy = await vacancyFactory.create({ 
        cycleId: cycle.id, 
        departmentId: department.id 
      })
      
      const career = await careerFactory.create()
      const student = await studentFactory.create({ careerId: career.id })

      // Create vacancy-to-student association
      await vacancyToStudentFactory.create({
        vacancyId: vacancy.id,
        studentId: student.id
      })

      const token = await jwtService.sign({
        id: student.id,
        name: student.name,
        code: student.code,
        careerId: student.careerId,
        email: student.email,
        telephone: student.telephone,
        createdAt: student.createdAt,
        updatedAt: student.updatedAt,
        scope: 'student'
      })

      // Create multipart form data
      const formData = new FormData()
      formData.append('vacancyId', vacancy.id)
      formData.append('reportNumber', '1')
      formData.append('hours', 150)
      
      // Create a mock file
      const fileBuffer = Buffer.from('mock pdf content')
      formData.append('file', fileBuffer, {
        filename: 'report.pdf',
        contentType: 'application/pdf'
      })

      const res = await app.inject({
        url: PATH,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`,
          ...formData.getHeaders()
        },
        payload: formData
      })
      console.log(res.payload)

      expect(res.statusCode).toBe(201)
      const body = res.json()
      
      expect(body).toHaveProperty('id')
      expect(body).toHaveProperty('studentId', student.id)
      expect(body).toHaveProperty('vacancyId', vacancy.id)
      expect(body).toHaveProperty('cycleId', cycle.id)
      expect(body).toHaveProperty('reportNumber', '1')
      expect(body).toHaveProperty('status', 'PENDING')
      expect(body).toHaveProperty('hours', 150)
      expect(body).toHaveProperty('fileId')
      expect(body).toHaveProperty('createdAt')
      expect(body).toHaveProperty('updatedAt')
      
      // Verify dates are in ISO format
      expect(body.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
      expect(body.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
    })

    it('Successfully creates report number 2', async () => {
      const cycle = await cycleFactory.create()
      const department = await departmentFactory.create()
      const vacancy = await vacancyFactory.create({ 
        cycleId: cycle.id, 
        departmentId: department.id 
      })
      
      const career = await careerFactory.create()
      const student = await studentFactory.create({ careerId: career.id })

      // Create vacancy-to-student association
      await vacancyToStudentFactory.create({
        vacancyId: vacancy.id,
        studentId: student.id
      })

      const token = await jwtService.sign({
        id: student.id,
        name: student.name,
        code: student.code,
        careerId: student.careerId,
        email: student.email,
        telephone: student.telephone,
        createdAt: student.createdAt,
        updatedAt: student.updatedAt,
        scope: 'student'
      })

      const formData = new FormData()
      formData.append('vacancyId', vacancy.id)
      formData.append('reportNumber', '2')
      formData.append('hours', 200)
      
      const fileBuffer = Buffer.from('second report content')
      formData.append('file', fileBuffer, {
        filename: 'report2.pdf',
        contentType: 'application/pdf'
      })

      const res = await app.inject({
        url: PATH,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`,
          ...formData.getHeaders()
        },
        payload: formData
      })

      expect(res.statusCode).toBe(201)
      const body = res.json()
      
      expect(body).toHaveProperty('reportNumber', '2')
      expect(body).toHaveProperty('hours', 200)
    })

    it('Returns 409 when student is not associated with the vacancy', async () => {
      const cycle = await cycleFactory.create()
      const department = await departmentFactory.create()
      const vacancy = await vacancyFactory.create({ 
        cycleId: cycle.id, 
        departmentId: department.id 
      })
      
      const career = await careerFactory.create()
      const student = await studentFactory.create({ careerId: career.id })

      // NOTE: No vacancy-to-student association created

      const token = await jwtService.sign({
        id: student.id,
        name: student.name,
        code: student.code,
        careerId: student.careerId,
        email: student.email,
        telephone: student.telephone,
        createdAt: student.createdAt,
        updatedAt: student.updatedAt,
        scope: 'student'
      })

      const formData = new FormData()
      formData.append('vacancyId', vacancy.id)
      formData.append('reportNumber', '1')
      formData.append('hours', 150)
      
      const fileBuffer = Buffer.from('mock content')
      formData.append('file', fileBuffer, {
        filename: 'report.pdf',
        contentType: 'application/pdf'
      })

      const res = await app.inject({
        url: PATH,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`,
          ...formData.getHeaders()
        },
        payload: formData
      })

      expect(res.statusCode).toBe(409)
      const body = res.json()
      expect(body).toHaveProperty('message', 'The student is not associated with the vacancy')
    })

    it('Returns 404 when vacancy does not exist', async () => {
      const career = await careerFactory.create()
      const student = await studentFactory.create({ careerId: career.id })

      const token = await jwtService.sign({
        id: student.id,
        name: student.name,
        code: student.code,
        careerId: student.careerId,
        email: student.email,
        telephone: student.telephone,
        createdAt: student.createdAt,
        updatedAt: student.updatedAt,
        scope: 'student'
      })

      const formData = new FormData()
      formData.append('vacancyId', 99999) // Non-existent vacancy
      formData.append('reportNumber', '1')
      formData.append('hours', 150)
      
      const fileBuffer = Buffer.from('mock content')
      formData.append('file', fileBuffer, {
        filename: 'report.pdf',
        contentType: 'application/pdf'
      })

      const res = await app.inject({
        url: PATH,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`,
          ...formData.getHeaders()
        },
        payload: formData
      })

      expect(res.statusCode).toBe(404)
      const body = res.json()
      expect(body).toHaveProperty('message', 'Vacancy not found')
    })

    it('Returns 400 when reportNumber is invalid (not 1 or 2)', async () => {
      const cycle = await cycleFactory.create()
      const department = await departmentFactory.create()
      const vacancy = await vacancyFactory.create({ 
        cycleId: cycle.id, 
        departmentId: department.id 
      })
      
      const career = await careerFactory.create()
      const student = await studentFactory.create({ careerId: career.id })

      await vacancyToStudentFactory.create({
        vacancyId: vacancy.id,
        studentId: student.id
      })

      const token = await jwtService.sign({
        id: student.id,
        name: student.name,
        code: student.code,
        careerId: student.careerId,
        email: student.email,
        telephone: student.telephone,
        createdAt: student.createdAt,
        updatedAt: student.updatedAt,
        scope: 'student'
      })

      const formData = new FormData()
      formData.append('vacancyId', vacancy.id)
      formData.append('reportNumber', '3') // Invalid report number
      formData.append('hours', 150)
      
      const fileBuffer = Buffer.from('mock content')
      formData.append('file', fileBuffer, {
        filename: 'report.pdf',
        contentType: 'application/pdf'
      })

      const res = await app.inject({
        url: PATH,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`,
          ...formData.getHeaders()
        },
        payload: formData
      })

      expect(res.statusCode).toBe(400)
      const body = res.json()
      expect(body).toHaveProperty('message', 'body/reportNumber/value must be equal to one of the allowed values')
    })

    it('Returns 400 when required fields are missing', async () => {
      const career = await careerFactory.create()
      const student = await studentFactory.create({ careerId: career.id })

      const token = await jwtService.sign({
        id: student.id,
        name: student.name,
        code: student.code,
        careerId: student.careerId,
        email: student.email,
        telephone: student.telephone,
        createdAt: student.createdAt,
        updatedAt: student.updatedAt,
        scope: 'student'
      })

      const formData = new FormData()
      // Missing required fields: vacancyId, reportNumber, hours, file

      const res = await app.inject({
        url: PATH,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`,
          ...formData.getHeaders()
        },
        payload: formData
      })

      expect(res.statusCode).toBe(400)
    })

    it('Returns 400 when no authorization token provided', async () => {
      const formData = new FormData()
      formData.append('vacancyId', 123)
      formData.append('reportNumber', '1')
      formData.append('hours', 150)
      
      const fileBuffer = Buffer.from('mock content')
      formData.append('file', fileBuffer, {
        filename: 'report.pdf',
        contentType: 'application/pdf'
      })

      const res = await app.inject({
        url: PATH,
        method: METHOD,
        headers: {
          ...formData.getHeaders()
        },
        payload: formData
      })

      expect(res.statusCode).toBe(400)
      const body = res.json()
      expect(body).toHaveProperty('message', 'headers must have required property \'authorization\'')
    })

    it('Returns 401 when token has wrong scope (user instead of student)', async () => {
      const user = await userFactory.create()

      // Create token with 'user' scope instead of 'student'
      const token = await jwtService.sign({
        id: user.id,
        user: user.user,
        name: user.name,
        role: user.role,
        permissions: user.permissions,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        scope: 'user' // Wrong scope
      })

      const formData = new FormData()
      formData.append('vacancyId', 123)
      formData.append('reportNumber', '1')
      formData.append('hours', 150)
      
      const fileBuffer = Buffer.from('mock content')
      formData.append('file', fileBuffer, {
        filename: 'report.pdf',
        contentType: 'application/pdf'
      })

      const res = await app.inject({
        url: PATH,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`,
          ...formData.getHeaders()
        },
        payload: formData
      })

      expect(res.statusCode).toBe(401)
    })

    it('Creates file record and uploads to Vercel Blob', async () => {
      const cycle = await cycleFactory.create()
      const department = await departmentFactory.create()
      const vacancy = await vacancyFactory.create({ 
        cycleId: cycle.id, 
        departmentId: department.id 
      })
      
      const career = await careerFactory.create()
      const student = await studentFactory.create({ careerId: career.id })

      await vacancyToStudentFactory.create({
        vacancyId: vacancy.id,
        studentId: student.id
      })

      const token = await jwtService.sign({
        id: student.id,
        name: student.name,
        code: student.code,
        careerId: student.careerId,
        email: student.email,
        telephone: student.telephone,
        createdAt: student.createdAt,
        updatedAt: student.updatedAt,
        scope: 'student'
      })

      const formData = new FormData()
      formData.append('vacancyId', vacancy.id)
      formData.append('reportNumber', '1')
      formData.append('hours', 150)
      
      const fileBuffer = Buffer.from('important report data')
      formData.append('file', fileBuffer, {
        filename: 'important-report.pdf',
        contentType: 'application/pdf'
      })

      const res = await app.inject({
        url: PATH,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`,
          ...formData.getHeaders()
        },
        payload: formData
      })

      expect(res.statusCode).toBe(201)
      const body = res.json()
      
      // Verify file was created with an ID
      expect(body).toHaveProperty('fileId')
      expect(typeof body.fileId).toBe('number')
      expect(body.fileId).toBeGreaterThan(0)
      
      // Verify other report properties
      expect(body).toHaveProperty('studentId', student.id)
      expect(body).toHaveProperty('vacancyId', vacancy.id)
      expect(body).toHaveProperty('reportNumber', '1')
      expect(body).toHaveProperty('hours', 150)
      expect(body).toHaveProperty('status', 'PENDING')
    })
  })
})
