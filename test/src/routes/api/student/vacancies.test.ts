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

describe('Student Vacancies API', () => {
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

  describe('GET /api/student/vacancies', () => {
    const PATH = '/api/student/vacancies'
    const METHOD = 'GET'
    
    it('Returns vacancies for current cycle with pagination', async () => {
      const cycle = await cycleFactory.create({ isCurrent: true })
      const department = await departmentFactory.create()
      await vacancyFactory.create({ cycleId: cycle.id, departmentId: department.id })
      await vacancyFactory.create({ cycleId: cycle.id, departmentId: department.id })
      
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
      })

      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body).toHaveProperty('total')
      expect(body).toHaveProperty('records')
      expect(Array.isArray(body.records)).toBe(true)
      expect(body.total).toBe(2)
      expect(body.records).toHaveLength(2)
      
      const vacancy = body.records[0]
      expect(vacancy).toHaveProperty('id')
      expect(vacancy).toHaveProperty('name')
      expect(vacancy).toHaveProperty('description')
      expect(vacancy).toHaveProperty('slots')
      expect(vacancy).toHaveProperty('cycleId')
      expect(vacancy).toHaveProperty('departmentId')
      expect(vacancy).toHaveProperty('disabled')
      expect(vacancy).toHaveProperty('createdAt')
      expect(vacancy).toHaveProperty('updatedAt')
      expect(vacancy).toHaveProperty('cycle')
      expect(vacancy).toHaveProperty('department')
      expect(typeof vacancy.id).toBe('number')
      expect(typeof vacancy.name).toBe('string')
      expect(typeof vacancy.description).toBe('string')
      expect(typeof vacancy.slots).toBe('number')
      expect(typeof vacancy.disabled).toBe('boolean')
    })

    it('Returns 404 when no current cycle exists', async () => {
      await cycleFactory.create({ isCurrent: false })
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
      })

      expect(res.statusCode).toBe(404)
      const body = res.json()
      expect(body).toHaveProperty('message')
      expect(body.message).toBe('No current cycle found')
    })

    it('Supports search functionality', async () => {
      const cycle = await cycleFactory.create({ isCurrent: true })
      const department = await departmentFactory.create()
      await vacancyFactory.create({ 
        cycleId: cycle.id, 
        departmentId: department.id,
        name: 'IT Support Specialist'
      })
      await vacancyFactory.create({ 
        cycleId: cycle.id, 
        departmentId: department.id,
        name: 'Marketing Assistant'
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
        url: `${PATH}?search=IT`,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        }
      })

      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.total).toBe(1)
      expect(body.records[0].name).toContain('IT')
    })

    it('Supports ordering functionality', async () => {
      const cycle = await cycleFactory.create({ isCurrent: true })
      const department = await departmentFactory.create()
      const vacancy1 = await vacancyFactory.create({ 
        cycleId: cycle.id, 
        departmentId: department.id,
        name: 'A First Position'
      })
      const vacancy2 = await vacancyFactory.create({ 
        cycleId: cycle.id, 
        departmentId: department.id,
        name: 'Z Last Position'
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
        url: `${PATH}?order=Vacancies.name`,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        }
      })

      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.records[0].name).toBe('A First Position')
      expect(body.records[1].name).toBe('Z Last Position')
    })

    it('Supports pagination with limit and offset', async () => {
      const cycle = await cycleFactory.create({ isCurrent: true })
      const department = await departmentFactory.create()
      
      for (let i = 0; i < 5; i++) {
        await vacancyFactory.create({ 
          cycleId: cycle.id, 
          departmentId: department.id,
          name: `Position ${i + 1}`
        })
      }
      
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
        url: `${PATH}?limit=2&offset=1`,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        }
      })

      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.total).toBe(5)
      expect(body.records).toHaveLength(2)
    })

    it('Only returns vacancies for current cycle, not other cycles', async () => {
      const currentCycle = await cycleFactory.create({ slug: '2024A', isCurrent: true })
      const oldCycle = await cycleFactory.create({ slug: '2024B', isCurrent: false })
      const department = await departmentFactory.create()
      
      await vacancyFactory.create({ cycleId: currentCycle.id, departmentId: department.id })
      await vacancyFactory.create({ cycleId: oldCycle.id, departmentId: department.id })
      
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
      })

      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.total).toBe(1)
      expect(body.records[0].cycleId).toBe(currentCycle.id)
    })
  })

  describe('GET /api/student/vacancies/associated', () => {
    const PATH = '/api/student/vacancies/associated'
    const METHOD = 'GET'
    
    it('Returns vacancies associated to the current student', async () => {
      const cycle = await cycleFactory.create({ isCurrent: true })
      const department = await departmentFactory.create()
      const vacancy1 = await vacancyFactory.create({ cycleId: cycle.id, departmentId: department.id })
      const vacancy2 = await vacancyFactory.create({ cycleId: cycle.id, departmentId: department.id })
      const vacancy3 = await vacancyFactory.create({ cycleId: cycle.id, departmentId: department.id })
      
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

      // Apply to first two vacancies
      const applyRes1 = await app.inject({
        url: `/api/student/vacancies/${vacancy1.id}/apply`,
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`
        }
      })
      expect(applyRes1.statusCode).toBe(204)

      // Create a second student to apply to vacancy2 (since student can only apply to one per cycle)
      const student2 = await studentFactory.create({ careerId: career.id })
      const token2 = await jwtService.sign({
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

      const applyRes2 = await app.inject({
        url: `/api/student/vacancies/${vacancy2.id}/apply`,
        method: 'POST',
        headers: {
          authorization: `Bearer ${token2}`
        }
      })
      expect(applyRes2.statusCode).toBe(204)

      // Get associated vacancies for first student (should only return vacancy1)
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
      expect(Array.isArray(body.records)).toBe(true)
      expect(body.total).toBe(1)
      expect(body.records).toHaveLength(1)
      expect(body.records[0].id).toBe(vacancy1.id)
      
      // Verify structure
      const vacancy = body.records[0]
      expect(vacancy).toHaveProperty('id')
      expect(vacancy).toHaveProperty('name')
      expect(vacancy).toHaveProperty('description')
      expect(vacancy).toHaveProperty('slots')
      expect(vacancy).toHaveProperty('cycleId')
      expect(vacancy).toHaveProperty('departmentId')
      expect(vacancy).toHaveProperty('disabled')
      expect(vacancy).toHaveProperty('createdAt')
      expect(vacancy).toHaveProperty('updatedAt')
      expect(vacancy).toHaveProperty('cycle')
    })

    it('Returns empty list when student has no associated vacancies', async () => {
      const cycle = await cycleFactory.create({ isCurrent: true })
      const department = await departmentFactory.create()
      await vacancyFactory.create({ cycleId: cycle.id, departmentId: department.id })
      
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
      })

      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.total).toBe(0)
      expect(body.records).toHaveLength(0)
    })

    it('Supports search functionality for associated vacancies', async () => {
      const cycle = await cycleFactory.create({ isCurrent: true })
      const department = await departmentFactory.create()
      const vacancy1 = await vacancyFactory.create({ 
        cycleId: cycle.id, 
        departmentId: department.id,
        name: 'IT Support Specialist'
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

      // Apply to vacancy
      const applyRes = await app.inject({
        url: `/api/student/vacancies/${vacancy1.id}/apply`,
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`
        }
      })
      expect(applyRes.statusCode).toBe(204)

      // Search for associated vacancies
      const res = await app.inject({
        url: `${PATH}?search=IT`,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        }
      })

      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.total).toBe(1)
      expect(body.records[0].name).toContain('IT')
    })

    it('Supports ordering functionality for associated vacancies', async () => {
      const cycle1 = await cycleFactory.create({ isCurrent: false })
      const cycle2 = await cycleFactory.create({ isCurrent: false })
      const department = await departmentFactory.create()
      const vacancy1 = await vacancyFactory.create({ 
        cycleId: cycle1.id, 
        departmentId: department.id,
        name: 'A First Position'
      })
      const vacancy2 = await vacancyFactory.create({ 
        cycleId: cycle2.id, 
        departmentId: department.id,
        name: 'Z Last Position'
      })
      
      const career = await careerFactory.create()
      const student1 = await studentFactory.create({ careerId: career.id })
      const student2 = await studentFactory.create({ careerId: career.id })
      const token1 = await jwtService.sign({
        id: student1.id,
        name: student1.name,
        code: student1.code,
        careerId: student1.careerId,
        email: student1.email,
        telephone: student1.telephone,
        createdAt: student1.createdAt,
        updatedAt: student1.updatedAt,
        scope: 'student'
      })
      const token2 = await jwtService.sign({
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

      // Apply to both vacancies with different students
      const applyRes1 = await app.inject({
        url: `/api/student/vacancies/${vacancy1.id}/apply`,
        method: 'POST',
        headers: {
          authorization: `Bearer ${token1}`
        }
      })
      expect(applyRes1.statusCode).toBe(204)

      const applyRes2 = await app.inject({
        url: `/api/student/vacancies/${vacancy2.id}/apply`,
        method: 'POST',
        headers: {
          authorization: `Bearer ${token2}`
        }
      })
      expect(applyRes2.statusCode).toBe(204)

      // Now apply both vacancies to student1 (need to create associations directly in DB)
      await app.db('VacanciesToStudents').insert({
        vacancyId: vacancy2.id,
        studentId: student1.id,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      const res = await app.inject({
        url: `${PATH}?order=Vacancies.name`,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token1}`
        }
      })

      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.records).toHaveLength(2)
      expect(body.records[0].name).toBe('A First Position')
      expect(body.records[1].name).toBe('Z Last Position')
    })

    it('Supports pagination with limit and offset for associated vacancies', async () => {
      const cycle = await cycleFactory.create({ isCurrent: false })
      const department = await departmentFactory.create()
      
      const vacancies = []
      for (let i = 0; i < 5; i++) {
        const vacancy = await vacancyFactory.create({ 
          cycleId: cycle.id, 
          departmentId: department.id,
          name: `Position ${i + 1}`
        })
        vacancies.push(vacancy)
      }
      
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

      // Create associations directly in DB for all vacancies
      for (const vacancy of vacancies) {
        await app.db('VacanciesToStudents').insert({
          vacancyId: vacancy.id,
          studentId: student.id,
          createdAt: new Date(),
          updatedAt: new Date()
        })
      }

      const res = await app.inject({
        url: `${PATH}?limit=2&offset=1`,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        }
      })

      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.total).toBe(5)
      expect(body.records).toHaveLength(2)
    })

    it('Only returns vacancies associated to the specific student', async () => {
      const cycle = await cycleFactory.create({ isCurrent: false })
      const department = await departmentFactory.create()
      const vacancy1 = await vacancyFactory.create({ cycleId: cycle.id, departmentId: department.id })
      const vacancy2 = await vacancyFactory.create({ cycleId: cycle.id, departmentId: department.id })
      
      const career = await careerFactory.create()
      const student1 = await studentFactory.create({ careerId: career.id })
      const student2 = await studentFactory.create({ careerId: career.id })
      const token1 = await jwtService.sign({
        id: student1.id,
        name: student1.name,
        code: student1.code,
        careerId: student1.careerId,
        email: student1.email,
        telephone: student1.telephone,
        createdAt: student1.createdAt,
        updatedAt: student1.updatedAt,
        scope: 'student'
      })

      // Create associations for both students to different vacancies
      await app.db('VacanciesToStudents').insert({
        vacancyId: vacancy1.id,
        studentId: student1.id,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      await app.db('VacanciesToStudents').insert({
        vacancyId: vacancy2.id,
        studentId: student2.id,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      // Student1 should only see their associated vacancy
      const res = await app.inject({
        url: PATH,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token1}`
        }
      })

      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.total).toBe(1)
      expect(body.records[0].id).toBe(vacancy1.id)
    })
  })

  describe('POST /api/student/vacancies/:id/apply', () => {
    const PATH = '/api/student/vacancies'
    const METHOD = 'POST'
    
    it('Successfully applies to a vacancy', async () => {
      const cycle = await cycleFactory.create({ isCurrent: true })
      const department = await departmentFactory.create()
      const vacancy = await vacancyFactory.create({ 
        cycleId: cycle.id, 
        departmentId: department.id,
        disabled: false,
        slots: 5
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
        url: `${PATH}/${vacancy.id}/apply`,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        }
      })

      expect(res.statusCode).toBe(204)
      expect(res.body).toBe('')
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

      const res = await app.inject({
        url: `${PATH}/99999/apply`,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        }
      })

      expect(res.statusCode).toBe(404)
      const body = res.json()
      expect(body.message).toBe('Vacancy not found')
    })

    it('Returns 400 when vacancy is disabled', async () => {
      const cycle = await cycleFactory.create({ isCurrent: true })
      const department = await departmentFactory.create()
      const vacancy = await vacancyFactory.create({ 
        cycleId: cycle.id, 
        departmentId: department.id,
        disabled: true
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
        url: `${PATH}/${vacancy.id}/apply`,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        }
      })

      expect(res.statusCode).toBe(400)
      const body = res.json()
      expect(body.message).toBe('Vacancy is not active')
    })

    it('Returns 404 when no current cycle exists', async () => {
      const cycle = await cycleFactory.create({ isCurrent: false })
      const department = await departmentFactory.create()
      const vacancy = await vacancyFactory.create({ 
        departmentId: department.id,
        cycleId: cycle.id,
        disabled: false
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
        url: `${PATH}/${vacancy.id}/apply`,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        }
      })

      expect(res.statusCode).toBe(404)
      const body = res.json()
      expect(body.message).toBe('No current cycle found')
    })

    it('Returns 400 when vacancy is not for current cycle', async () => {
      const currentCycle = await cycleFactory.create({ isCurrent: true })
      const oldCycle = await cycleFactory.create({ isCurrent: false })
      const department = await departmentFactory.create()
      const vacancy = await vacancyFactory.create({ 
        cycleId: oldCycle.id,
        departmentId: department.id,
        disabled: false
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
        url: `${PATH}/${vacancy.id}/apply`,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        }
      })

      expect(res.statusCode).toBe(400)
      const body = res.json()
      expect(body.message).toBe('Vacancy is not for the current cycle')
    })

    it('Returns 409 when student already applied to a vacancy for current cycle', async () => {
      const cycle = await cycleFactory.create({ isCurrent: true })
      const department = await departmentFactory.create()
      const vacancy1 = await vacancyFactory.create({ 
        cycleId: cycle.id, 
        departmentId: department.id,
        disabled: false,
        slots: 5
      })
      const vacancy2 = await vacancyFactory.create({ 
        cycleId: cycle.id, 
        departmentId: department.id,
        disabled: false,
        slots: 5
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

      // First application should succeed
      const res1 = await app.inject({
        url: `${PATH}/${vacancy1.id}/apply`,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        }
      })
      expect(res1.statusCode).toBe(204)

      // Second application to different vacancy should fail
      const res2 = await app.inject({
        url: `${PATH}/${vacancy2.id}/apply`,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        }
      })

      expect(res2.statusCode).toBe(409)
      const body = res2.json()
      expect(body.message).toBe('Student already has a vacancy association for this cycle')
    })

    it('Returns 400 when vacancy has no available slots', async () => {
      const cycle = await cycleFactory.create({ isCurrent: true })
      const department = await departmentFactory.create()
      const vacancy = await vacancyFactory.create({ 
        cycleId: cycle.id, 
        departmentId: department.id,
        disabled: false,
        slots: 1
      })
      
      const career = await careerFactory.create()
      const student1 = await studentFactory.create({ careerId: career.id })
      const student2 = await studentFactory.create({ careerId: career.id })
      
      const token1 = await jwtService.sign({
        id: student1.id,
        name: student1.name,
        code: student1.code,
        careerId: student1.careerId,
        email: student1.email,
        telephone: student1.telephone,
        createdAt: student1.createdAt,
        updatedAt: student1.updatedAt,
        scope: 'student'
      })

      const token2 = await jwtService.sign({
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

      // First student fills the slot
      const res1 = await app.inject({
        url: `${PATH}/${vacancy.id}/apply`,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token1}`
        }
      })
      expect(res1.statusCode).toBe(204)

      // Second student should be rejected
      const res2 = await app.inject({
        url: `${PATH}/${vacancy.id}/apply`,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token2}`
        }
      })

      expect(res2.statusCode).toBe(400)
      const body = res2.json()
      expect(body.message).toBe('Vacancy has no available slots')
    })
  })
})
