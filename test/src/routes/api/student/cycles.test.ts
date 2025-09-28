import { describe, beforeAll, afterAll, expect } from 'vitest'
import { isolatedIt as it } from '#test/utils/isolatedIt.js'
import build from '#src/build.js'
import { cycleFactory } from '#test/utils/factories/cycle.js'
import { studentFactory } from '#test/utils/factories/student.js'
import { JwtService } from '#src/service/jwt/index.js'
import configuration from '#src/common/configuration.js'
import { careerFactory } from '#test/utils/factories/career.js'

describe('Cycles API', () => {
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

  describe('GET /api/student/cycles/current', () => {
    const PATH = '/api/student/cycles/current'
    const METHOD = 'GET'
    
    it('Returns current cycle when one exists', async () => {
      await cycleFactory.create({ isCurrent: true })
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
      expect(body).toHaveProperty('id')
      expect(body).toHaveProperty('slug')
      expect(body).toHaveProperty('isCurrent')
      expect(body).toHaveProperty('createdAt')
      expect(body).toHaveProperty('updatedAt')
      expect(body.isCurrent).toBe(true)
      expect(typeof body.id).toBe('number')
      expect(typeof body.slug).toBe('string')
      expect(typeof body.createdAt).toBe('string')
      expect(typeof body.updatedAt).toBe('string')
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
  })
})
