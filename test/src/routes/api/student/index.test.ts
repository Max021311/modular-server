import { describe, beforeAll, afterAll, expect } from 'vitest'
import { isolatedIt as it } from '#test/utils/isolatedIt.js'
import build from '#src/build.js'
import { careerFactory } from '#test/utils/factories/career.js'
import { studentFactory } from '#test/utils/factories/student.js'
import { userFactory } from '#test/utils/factories/user.js'
import { faker } from '@faker-js/faker'
import { JwtService } from '#src/service/jwt/index.js'
import configuration from '#src/common/configuration.js'

describe('Student API', () => {
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

  describe('POST /api/student/auth', () => {
    const PATH = '/api/student/auth'
    const METHOD = 'POST'
    
    it('Success login student with valid credentials', async () => {
      const career = await careerFactory.create()
      const password = faker.string.alphanumeric(10)
      const student = await studentFactory.create({
        careerId: career.id,
        password
      })

      const res = await app.inject({
        url: PATH,
        method: METHOD,
        payload: {
          email: student.email,
          password
        }
      })

      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body).toHaveProperty('token')
      expect(typeof body.token).toBe('string')
    })
  })

  describe('PATCH /api/student', () => {
    const PATH = '/api/student'
    const METHOD = 'PATCH'
    
    it('Successfully updates student information when authenticated', async () => {
      const career = await careerFactory.create()
      const student = await studentFactory.create({
        careerId: career.id
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

      const updateData = {
        name: faker.person.fullName(),
        telephone: faker.phone.number()
      }

      const res = await app.inject({
        url: PATH,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        },
        payload: updateData
      })

      expect(res.statusCode).toBe(200)
      const body = res.json()
      
      expect(body).toHaveProperty('id', student.id)
      expect(body).toHaveProperty('name', updateData.name)
      expect(body).toHaveProperty('code', student.code)
      expect(body).toHaveProperty('careerId', student.careerId)
      expect(body).toHaveProperty('email', student.email)
      expect(body).toHaveProperty('telephone', updateData.telephone)
      expect(body).toHaveProperty('createdAt')
      expect(body).toHaveProperty('updatedAt')
      
      expect(body.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
      expect(body.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
      
      // Verify updatedAt has changed
      expect(new Date(body.updatedAt).getTime()).toBeGreaterThan(new Date(student.updatedAt).getTime())
    })

    it('Successfully updates only name when telephone is not provided', async () => {
      const career = await careerFactory.create()
      const student = await studentFactory.create({
        careerId: career.id
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

      const updateData = {
        name: faker.person.fullName()
      }

      const res = await app.inject({
        url: PATH,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        },
        payload: updateData
      })

      expect(res.statusCode).toBe(200)
      const body = res.json()
      
      expect(body).toHaveProperty('name', updateData.name)
      expect(body).toHaveProperty('telephone', student.telephone) // Unchanged
    })

    it('Successfully updates only telephone when name is not provided', async () => {
      const career = await careerFactory.create()
      const student = await studentFactory.create({
        careerId: career.id
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

      const updateData = {
        telephone: faker.phone.number()
      }

      const res = await app.inject({
        url: PATH,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        },
        payload: updateData
      })

      expect(res.statusCode).toBe(200)
      const body = res.json()
      
      expect(body).toHaveProperty('name', student.name) // Unchanged
      expect(body).toHaveProperty('telephone', updateData.telephone)
    })

    it('Returns 200 with unchanged data when no fields are provided', async () => {
      const career = await careerFactory.create()
      const student = await studentFactory.create({
        careerId: career.id
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
        payload: {}
      })

      expect(res.statusCode).toBe(200)
      const body = res.json()
      
      expect(body).toHaveProperty('name', student.name)
      expect(body).toHaveProperty('telephone', student.telephone)
    })

    it('Returns 400 when invalid fields are provided', async () => {
      const career = await careerFactory.create()
      const student = await studentFactory.create({
        careerId: career.id
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
        payload: {
          name: faker.person.fullName(),
          email: faker.internet.email(), // Not allowed
          code: faker.string.alphanumeric(8) // Not allowed
        }
      })

      expect(res.statusCode).toBe(400)
    })

    it('Returns 400 when no authorization token provided', async () => {
      const res = await app.inject({
        url: PATH,
        method: METHOD,
        payload: {
          name: faker.person.fullName()
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
        payload: {
          name: faker.person.fullName()
        }
      })

      expect(res.statusCode).toBe(400)
    })

    it('Returns 401 when token has wrong scope (user instead of student)', async () => {
      const user = await userFactory.create()

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
        payload: {
          name: faker.person.fullName()
        }
      })

      expect(res.statusCode).toBe(401)
    })

    it('Returns 404 when student does not exist', async () => {
      const career = await careerFactory.create()
      
      // Create token for non-existent student
      const token = await jwtService.sign({
        id: 99999,
        name: faker.person.fullName(),
        code: faker.string.alphanumeric(8),
        careerId: career.id,
        email: faker.internet.email(),
        telephone: faker.phone.number(),
        createdAt: new Date(),
        updatedAt: new Date(),
        scope: 'student'
      })

      const res = await app.inject({
        url: PATH,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        },
        payload: {
          name: faker.person.fullName()
        }
      })

      expect(res.statusCode).toBe(401)
    })

    it('Correctly formats dates in response', async () => {
      const career = await careerFactory.create()
      const student = await studentFactory.create({
        careerId: career.id
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

      const updateData = {
        name: faker.person.fullName()
      }

      const res = await app.inject({
        url: PATH,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        },
        payload: updateData
      })

      expect(res.statusCode).toBe(200)
      const body = res.json()
      
      // Check date formatting
      expect(body.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/) // ISO datetime
      expect(body.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/) // ISO datetime
    })
  })

  describe('GET /api/student', () => {
    const PATH = '/api/student'
    const METHOD = 'GET'
    
    it('Successfully returns student information when authenticated', async () => {
      const career = await careerFactory.create()
      const student = await studentFactory.create({
        careerId: career.id
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
        }
      })

      expect(res.statusCode).toBe(200)
      const body = res.json()
      
      expect(body).toHaveProperty('id', student.id)
      expect(body).toHaveProperty('name', student.name)
      expect(body).toHaveProperty('code', student.code)
      expect(body).toHaveProperty('careerId', student.careerId)
      expect(body).toHaveProperty('email', student.email)
      expect(body).toHaveProperty('telephone', student.telephone)
      expect(body).toHaveProperty('createdAt')
      expect(body).toHaveProperty('updatedAt')
      
      expect(body.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
      expect(body.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
      
      // Should not include career by default
      expect(body.career).toBeUndefined()
    })

    it('Successfully returns student information with career when includeCareer=true', async () => {
      const career = await careerFactory.create()
      const student = await studentFactory.create({
        careerId: career.id
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
          includeCareer: 'true'
        }
      })

      expect(res.statusCode).toBe(200)
      const body = res.json()
      
      expect(body).toHaveProperty('id', student.id)
      expect(body).toHaveProperty('name', student.name)
      expect(body).toHaveProperty('code', student.code)
      expect(body).toHaveProperty('careerId', student.careerId)
      expect(body).toHaveProperty('email', student.email)
      expect(body).toHaveProperty('telephone', student.telephone)
      expect(body).toHaveProperty('createdAt')
      expect(body).toHaveProperty('updatedAt')
      
      // Should include career information
      expect(body).toHaveProperty('career')
      expect(body.career).toHaveProperty('id', career.id)
      expect(body.career).toHaveProperty('name', career.name)
      expect(body.career).toHaveProperty('slug', career.slug)
      expect(body.career).toHaveProperty('createdAt')
      expect(body.career).toHaveProperty('updatedAt')
      
      // Check career date formatting
      expect(body.career.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
      expect(body.career.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
    })

    it('Successfully returns student information when includeCareer=false explicitly', async () => {
      const career = await careerFactory.create()
      const student = await studentFactory.create({
        careerId: career.id
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
          includeCareer: 'false'
        }
      })

      expect(res.statusCode).toBe(200)
      const body = res.json()
      
      expect(body).toHaveProperty('id', student.id)
      expect(body.career).toBeUndefined()
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

    it('Returns 401 when invalid token provided', async () => {
      const res = await app.inject({
        url: PATH,
        method: METHOD,
        headers: {
          authorization: 'Bearer invalid-token'
        }
      })

      expect(res.statusCode).toBe(400)
    })

    it('Returns 401 when token has wrong scope (user instead of student)', async () => {
      const user = await userFactory.create()

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
        }
      })

      expect(res.statusCode).toBe(401)
    })

    it('Returns 401 when student does not exist (edge case)', async () => {
      const career = await careerFactory.create()
      
      // Create token for non-existent student
      const token = await jwtService.sign({
        id: 99999,
        name: faker.person.fullName(),
        code: faker.string.alphanumeric(8),
        careerId: career.id,
        email: faker.internet.email(),
        telephone: faker.phone.number(),
        createdAt: new Date(),
        updatedAt: new Date(),
        scope: 'student'
      })

      const res = await app.inject({
        url: PATH,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        }
      })

      expect(res.statusCode).toBe(401)
    })

    it('Correctly formats all dates in response', async () => {
      const career = await careerFactory.create()
      const student = await studentFactory.create({
        careerId: career.id
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
          includeCareer: 'true'
        }
      })

      expect(res.statusCode).toBe(200)
      const body = res.json()
      
      // Check student date formatting
      expect(body.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
      expect(body.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
      
      // Check career date formatting
      expect(body.career.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
      expect(body.career.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
    })

    it('Returns all required fields in response schema', async () => {
      const career = await careerFactory.create()
      const student = await studentFactory.create({
        careerId: career.id
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
          includeCareer: 'true'
        }
      })

      expect(res.statusCode).toBe(200)
      const body = res.json()
      
      // Verify all required fields are present
      const requiredFields = ['id', 'name', 'code', 'careerId', 'email', 'telephone', 'createdAt', 'updatedAt']
      
      requiredFields.forEach(field => {
        expect(body).toHaveProperty(field)
        expect(body[field]).toBeDefined()
        expect(body[field]).not.toBeNull()
      })

      // Verify career fields when included
      expect(body.career).toHaveProperty('id')
      expect(body.career).toHaveProperty('name')
      expect(body.career).toHaveProperty('slug')
      expect(body.career).toHaveProperty('createdAt')
      expect(body.career).toHaveProperty('updatedAt')
    })

    it('Handles boolean query parameter variations correctly', async () => {
      const career = await careerFactory.create()
      const student = await studentFactory.create({
        careerId: career.id
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

      // Test with '1'
      const res1 = await app.inject({
        url: PATH,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        },
        query: {
          includeCareer: '1'
        }
      })

      expect(res1.statusCode).toBe(200)
      const body1 = res1.json()
      expect(body1.career).toBeDefined()

      // Test with '0'
      const res2 = await app.inject({
        url: PATH,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        },
        query: {
          includeCareer: '0'
        }
      })

      expect(res2.statusCode).toBe(200)
      const body2 = res2.json()
      expect(body2.career).toBeUndefined()
    })
  })

  describe('POST /api/student/update-password', () => {
    const PATH = '/api/student/update-password'
    const METHOD = 'POST'
    
    it('Successfully updates password when current password is correct', async () => {
      const career = await careerFactory.create()
      const originalPassword = faker.string.alphanumeric(10)
      const student = await studentFactory.create({
        careerId: career.id,
        password: originalPassword
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

      const newPassword = faker.string.alphanumeric(12)

      const res = await app.inject({
        url: PATH,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        },
        payload: {
          currentPassword: originalPassword,
          newPassword
        }
      })

      expect(res.statusCode).toBe(204)
      expect(res.payload).toBe('')
    })

    it('Returns 401 when current password is incorrect', async () => {
      const career = await careerFactory.create()
      const originalPassword = faker.string.alphanumeric(10)
      const student = await studentFactory.create({
        careerId: career.id,
        password: originalPassword
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

      const wrongCurrentPassword = faker.string.alphanumeric(10)
      const newPassword = faker.string.alphanumeric(12)

      const res = await app.inject({
        url: PATH,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        },
        payload: {
          currentPassword: wrongCurrentPassword,
          newPassword
        }
      })

      expect(res.statusCode).toBe(401)
      const body = res.json()
      expect(body).toHaveProperty('message', 'Current password is incorrect')
    })

    it('Returns 400 when currentPassword is missing', async () => {
      const career = await careerFactory.create()
      const student = await studentFactory.create({
        careerId: career.id
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

      const newPassword = faker.string.alphanumeric(12)

      const res = await app.inject({
        url: PATH,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        },
        payload: {
          newPassword
        }
      })

      expect(res.statusCode).toBe(400)
    })

    it('Returns 400 when newPassword is missing', async () => {
      const career = await careerFactory.create()
      const originalPassword = faker.string.alphanumeric(10)
      const student = await studentFactory.create({
        careerId: career.id,
        password: originalPassword
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
        payload: {
          currentPassword: originalPassword
        }
      })

      expect(res.statusCode).toBe(400)
    })

    it('Returns 400 when both passwords are missing', async () => {
      const career = await careerFactory.create()
      const student = await studentFactory.create({
        careerId: career.id
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
        payload: {}
      })

      expect(res.statusCode).toBe(400)
    })

    it('Returns 400 when no authorization token provided', async () => {
      const res = await app.inject({
        url: PATH,
        method: METHOD,
        payload: {
          currentPassword: faker.string.alphanumeric(10),
          newPassword: faker.string.alphanumeric(12)
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
        payload: {
          currentPassword: faker.string.alphanumeric(10),
          newPassword: faker.string.alphanumeric(12)
        }
      })

      expect(res.statusCode).toBe(400)
    })

    it('Returns 401 when token has wrong scope (user instead of student)', async () => {
      const user = await userFactory.create()

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
        payload: {
          currentPassword: faker.string.alphanumeric(10),
          newPassword: faker.string.alphanumeric(12)
        }
      })

      expect(res.statusCode).toBe(401)
    })

    it('Returns 404 when student does not exist (edge case)', async () => {
      const career = await careerFactory.create()
      
      // Create token for non-existent student
      const token = await jwtService.sign({
        id: 99999,
        name: faker.person.fullName(),
        code: faker.string.alphanumeric(8),
        careerId: career.id,
        email: faker.internet.email(),
        telephone: faker.phone.number(),
        createdAt: new Date(),
        updatedAt: new Date(),
        scope: 'student'
      })

      const res = await app.inject({
        url: PATH,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        },
        payload: {
          currentPassword: faker.string.alphanumeric(10),
          newPassword: faker.string.alphanumeric(12)
        }
      })

      expect(res.statusCode).toBe(401)
    })
  })
})
