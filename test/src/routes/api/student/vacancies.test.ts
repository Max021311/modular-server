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
})
