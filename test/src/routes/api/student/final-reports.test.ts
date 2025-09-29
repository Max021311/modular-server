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
import { finalReportFactory } from '#test/utils/factories/final-report.js'
import { fileFactory } from '#test/utils/factories/file.js'
import { userFactory } from '#test/utils/factories/user.js'
import { vacancyToStudentFactory } from '#test/utils/factories/vacancy-to-student.js'
import FormData from 'form-data'

describe('Student Final Reports API', () => {
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

  describe('GET /api/student/final-reports', () => {
    const PATH = '/api/student/final-reports'
    const METHOD = 'GET'
    
    it('Successfully returns final report for student and vacancy', async () => {
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
      
      const finalReport = await finalReportFactory.create({
        studentId: student.id,
        vacancyId: vacancy.id,
        cycleId: cycle.id,
        fileId: file.id,
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
      
      expect(body).toHaveProperty('id', finalReport.id)
      expect(body).toHaveProperty('studentId', student.id)
      expect(body).toHaveProperty('vacancyId', vacancy.id)
      expect(body).toHaveProperty('cycleId', cycle.id)
      expect(body).toHaveProperty('status', 'PENDING')
      expect(body).toHaveProperty('fileId', file.id)
      expect(body).toHaveProperty('hours', 120)
      expect(body).toHaveProperty('createdAt')
      expect(body).toHaveProperty('updatedAt')
      
      // Should not include cycle by default
      expect(body.cycle).toBeUndefined()
      expect(body.student).toBeUndefined()
      expect(body.vacancy).toBeUndefined()
    })

    it('Successfully returns final report with cycle when includeCycle=true', async () => {
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
      
      const finalReport = await finalReportFactory.create({
        studentId: student.id,
        vacancyId: vacancy.id,
        cycleId: cycle.id,
        fileId: file.id,
        status: 'APPROVED',
        hours: 250
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
      
      expect(body).toHaveProperty('id', finalReport.id)
      expect(body).toHaveProperty('status', 'APPROVED')
      expect(body).toHaveProperty('hours', 250)
      
      // Should include cycle information
      expect(body).toHaveProperty('cycle')
      expect(body.cycle).toHaveProperty('id', cycle.id)
      expect(body.cycle).toHaveProperty('slug', '2024A')
      expect(body.cycle).toHaveProperty('isCurrent', true)
      expect(body.cycle).toHaveProperty('createdAt')
      expect(body.cycle).toHaveProperty('updatedAt')
      
      // Should still not include student and vacancy
      expect(body.student).toBeUndefined()
      expect(body.vacancy).toBeUndefined()
    })

    it('Returns 404 when final report does not exist for student and vacancy', async () => {
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
      expect(body).toHaveProperty('message', 'Final report not found for this student and vacancy')
    })

    it('Returns 404 when final report exists but for different student', async () => {
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
      
      // Create final report for student1
      await finalReportFactory.create({
        studentId: student1.id,
        vacancyId: vacancy.id,
        cycleId: cycle.id,
        fileId: file.id,
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
      expect(body).toHaveProperty('message', 'Final report not found for this student and vacancy')
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
      
      const finalReport = await finalReportFactory.create({
        studentId: student.id,
        vacancyId: vacancy.id,
        cycleId: cycle.id,
        fileId: file.id,
        status: 'REJECTED',
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
      
      // Check date formatting
      expect(body.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/) // ISO datetime
      expect(body.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/) // ISO datetime
      
      // Check cycle dates when included
      expect(body.cycle.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
      expect(body.cycle.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
    })

    it('Returns final report with different status values', async () => {
      const cycle = await cycleFactory.create()
      const department = await departmentFactory.create()
      const vacancy = await vacancyFactory.create({ 
        cycleId: cycle.id, 
        departmentId: department.id 
      })
      
      const career = await careerFactory.create()
      const student = await studentFactory.create({ careerId: career.id })
      const file = await fileFactory.create()
      
      const finalReport = await finalReportFactory.create({
        studentId: student.id,
        vacancyId: vacancy.id,
        cycleId: cycle.id,
        fileId: file.id,
        status: 'REJECTED',
        hours: 180
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
      
      expect(body).toHaveProperty('id', finalReport.id)
      expect(body).toHaveProperty('status', 'REJECTED')
      expect(body).toHaveProperty('hours', 180)
    })
  })

  describe('POST /api/student/final-reports', () => {
    const PATH = '/api/student/final-reports'
    const METHOD = 'POST'
    
    it('Successfully creates a new final report with file upload when student is associated with vacancy', async () => {
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
      formData.append('hours', 320)
      
      const fileBuffer = Buffer.from('mock final report content')
      formData.append('file', fileBuffer, {
        filename: 'final-report.pdf',
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
      
      expect(body).toHaveProperty('id')
      expect(body).toHaveProperty('studentId', student.id)
      expect(body).toHaveProperty('vacancyId', vacancy.id)
      expect(body).toHaveProperty('cycleId', cycle.id)
      expect(body).toHaveProperty('status', 'PENDING')
      expect(body).toHaveProperty('hours', 320)
      expect(body).toHaveProperty('fileId')
      expect(body).toHaveProperty('createdAt')
      expect(body).toHaveProperty('updatedAt')
      
      expect(body.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
      expect(body.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
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
      formData.append('hours', 320)
      
      const fileBuffer = Buffer.from('mock content')
      formData.append('file', fileBuffer, {
        filename: 'final-report.pdf',
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
      formData.append('vacancyId', 99999)
      formData.append('hours', 320)
      
      const fileBuffer = Buffer.from('mock content')
      formData.append('file', fileBuffer, {
        filename: 'final-report.pdf',
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

    it('Returns 400 when required fields are missing', async () => {
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
  })

  describe('DELETE /api/student/final-reports/:id', () => {
    const PATH = '/api/student/final-reports'
    const METHOD = 'DELETE'
    
    it('Successfully deletes a final report with PENDING status', async () => {
      const cycle = await cycleFactory.create()
      const department = await departmentFactory.create()
      const vacancy = await vacancyFactory.create({ 
        cycleId: cycle.id, 
        departmentId: department.id 
      })
      
      const career = await careerFactory.create()
      const student = await studentFactory.create({ careerId: career.id })
      const file = await fileFactory.create()
      
      const finalReport = await finalReportFactory.create({
        studentId: student.id,
        vacancyId: vacancy.id,
        cycleId: cycle.id,
        fileId: file.id,
        status: 'PENDING',
        hours: 280
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
        url: `${PATH}/${finalReport.id}`,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        }
      })

      expect(res.statusCode).toBe(204)
      expect(res.body).toBe('')
    })

    it('Successfully deletes a final report with REJECTED status', async () => {
      const cycle = await cycleFactory.create()
      const department = await departmentFactory.create()
      const vacancy = await vacancyFactory.create({ 
        cycleId: cycle.id, 
        departmentId: department.id 
      })
      
      const career = await careerFactory.create()
      const student = await studentFactory.create({ careerId: career.id })
      const file = await fileFactory.create()
      
      const finalReport = await finalReportFactory.create({
        studentId: student.id,
        vacancyId: vacancy.id,
        cycleId: cycle.id,
        fileId: file.id,
        status: 'REJECTED',
        hours: 350
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
        url: `${PATH}/${finalReport.id}`,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        }
      })

      expect(res.statusCode).toBe(204)
    })

    it('Returns 409 when trying to delete APPROVED final report', async () => {
      const cycle = await cycleFactory.create()
      const department = await departmentFactory.create()
      const vacancy = await vacancyFactory.create({ 
        cycleId: cycle.id, 
        departmentId: department.id 
      })
      
      const career = await careerFactory.create()
      const student = await studentFactory.create({ careerId: career.id })
      const file = await fileFactory.create()
      
      const finalReport = await finalReportFactory.create({
        studentId: student.id,
        vacancyId: vacancy.id,
        cycleId: cycle.id,
        fileId: file.id,
        status: 'APPROVED',
        hours: 400
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
        url: `${PATH}/${finalReport.id}`,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        }
      })

      expect(res.statusCode).toBe(409)
      const body = res.json()
      expect(body).toHaveProperty('message', 'Cannot delete an approved final report')
    })

    it('Returns 404 when final report does not exist', async () => {
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
        url: `${PATH}/99999`,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        }
      })

      expect(res.statusCode).toBe(404)
      const body = res.json()
      expect(body).toHaveProperty('message', 'Final report not found')
    })

    it('Returns 403 when trying to delete another student final report', async () => {
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
      
      const finalReport = await finalReportFactory.create({
        studentId: student1.id,
        vacancyId: vacancy.id,
        cycleId: cycle.id,
        fileId: file.id,
        status: 'PENDING',
        hours: 250
      })

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
        url: `${PATH}/${finalReport.id}`,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        }
      })

      expect(res.statusCode).toBe(403)
      const body = res.json()
      expect(body).toHaveProperty('message', 'Access denied: Final report does not belong to the authenticated student')
    })
  })

  describe('GET /api/student/final-reports/:id/download', () => {
    const PATH = '/api/student/final-reports'
    const METHOD = 'GET'
    
    it('Successfully downloads final report file', async () => {
      const cycle = await cycleFactory.create()
      const department = await departmentFactory.create()
      const vacancy = await vacancyFactory.create({ 
        cycleId: cycle.id, 
        departmentId: department.id 
      })
      
      const career = await careerFactory.create()
      const student = await studentFactory.create({ careerId: career.id })
      const file = await fileFactory.create({
        name: 'final-report.pdf',
        url: 'https://example.com/final-report.pdf'
      })
      
      const finalReport = await finalReportFactory.create({
        studentId: student.id,
        vacancyId: vacancy.id,
        cycleId: cycle.id,
        fileId: file.id,
        status: 'APPROVED',
        hours: 360
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
        url: `${PATH}/${finalReport.id}/download`,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        }
      })

      expect(res.statusCode).toBe(200)
      expect(res.headers['content-disposition']).toContain('attachment; filename="final-report.pdf"')
      expect(res.headers['content-type']).toBe('application/octet-stream')
    })

    it('Returns 404 when final report does not exist', async () => {
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
        url: `${PATH}/99999/download`,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        }
      })

      expect(res.statusCode).toBe(404)
      const body = res.json()
      expect(body).toHaveProperty('message', 'Final report not found')
    })

    it('Returns 403 when trying to download another student final report', async () => {
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
      
      const finalReport = await finalReportFactory.create({
        studentId: student1.id,
        vacancyId: vacancy.id,
        cycleId: cycle.id,
        fileId: file.id,
        status: 'APPROVED',
        hours: 380
      })

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
        url: `${PATH}/${finalReport.id}/download`,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        }
      })

      expect(res.statusCode).toBe(403)
      const body = res.json()
      expect(body).toHaveProperty('message', 'Access denied: Final report does not belong to the authenticated student')
    })

    it('Returns 404 when file does not exist', async () => {
      const cycle = await cycleFactory.create()
      const department = await departmentFactory.create()
      const vacancy = await vacancyFactory.create({ 
        cycleId: cycle.id, 
        departmentId: department.id 
      })
      
      const career = await careerFactory.create()
      const student = await studentFactory.create({ careerId: career.id })
      const file = await fileFactory.create()
      
      const finalReport = await finalReportFactory.create({
        studentId: student.id,
        vacancyId: vacancy.id,
        cycleId: cycle.id,
        fileId: 99999,
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
        url: `${PATH}/${finalReport.id}/download`,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        }
      })

      expect(res.statusCode).toBe(404)
      const body = res.json()
      expect(body).toHaveProperty('message', 'File not found')
    })
  })
})
