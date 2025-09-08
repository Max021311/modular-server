import { describe, beforeAll, afterAll, expect } from 'vitest'
import { isolatedIt as it } from '#test/utils/isolatedIt'
import build from '#src/build'
import { userFactory } from '#test/utils/factories/user'
import { faker } from '@faker-js/faker'
import configuration from '#src/common/configuration'
import { JwtService } from '#src/service/jwt'

describe('Users API', () => {
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

  describe('POST /user/auth', () => {
    const PATH = '/user/auth'
    const METHOD = 'POST'
    it('Success login', async () => {
      const password = faker.string.alphanumeric(10)
      const user = await userFactory.create({
        password
      })
      const res = await app.inject({
        url: PATH,
        method: METHOD,
        payload: {
          user: user.user,
          password: password
        }
      })
      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body).toHaveProperty('token')
    })
  })

  describe('POST /user/add', () => {
    const PATH = '/user/add'
    const METHOD = 'POST'
    
    it('Success create user with valid invite token', async () => {
      const userData = {
        name: faker.person.fullName(),
        user: faker.internet.email(),
        role: 'member' as const,
        permissions: ['read:users', 'write:users']
      }
      
      const inviteToken = await jwtService.sign({
        ...userData,
        scope: 'invite-user'
      })

      const password = faker.string.alphanumeric(10)

      const res = await app.inject({
        url: PATH,
        method: METHOD,
        headers: {
          authorization: `Bearer ${inviteToken}`
        },
        payload: {
          password
        }
      })

      expect(res.statusCode).toBe(201)
      const body = res.json()
      expect(body).toHaveProperty('id')
    })

    it('Returns 400 when authorization header is missing', async () => {
      const res = await app.inject({
        url: PATH,
        method: METHOD,
        payload: {
          password: faker.string.alphanumeric(10)
        }
      })

      expect(res.statusCode).toBe(400)
    })

    it('Returns 401 when authorization header does not start with Bearer', async () => {
      const res = await app.inject({
        url: PATH,
        method: METHOD,
        headers: {
          authorization: 'InvalidToken'
        },
        payload: {
          password: faker.string.alphanumeric(10)
        }
      })

      expect(res.statusCode).toBe(401)
      const body = res.json()
      expect(body).toHaveProperty('message', 'Invalid token')
    })

    it('Returns 403 when token has wrong scope', async () => {
      const userData = {
        name: faker.person.fullName(),
        user: faker.internet.email(),
        role: 'member' as const,
        permissions: ['read:users']
      }
      
      const wrongScopeToken = await jwtService.sign({
        ...userData,
        scope: 'user'
      })

      const res = await app.inject({
        url: PATH,
        method: METHOD,
        headers: {
          authorization: `Bearer ${wrongScopeToken}`
        },
        payload: {
          password: faker.string.alphanumeric(10)
        }
      })

      expect(res.statusCode).toBe(403)
      const body = res.json()
      expect(body).toHaveProperty('message', 'Invalid token')
    })

    it('Returns 400 when password is missing', async () => {
      const userData = {
        name: faker.person.fullName(),
        user: faker.internet.email(),
        role: 'member' as const,
        permissions: ['read:users']
      }
      
      const inviteToken = await jwtService.sign({
        ...userData,
        scope: 'invite-user'
      })

      const res = await app.inject({
        url: PATH,
        method: METHOD,
        headers: {
          authorization: `Bearer ${inviteToken}`
        },
        payload: {}
      })

      expect(res.statusCode).toBe(400)
    })
  })

  describe('POST /user/invite', () => {
    const PATH = '/user/invite'
    const METHOD = 'POST'
    
    it('Success send user invitation', async () => {
      const password = faker.string.alphanumeric(10)
      const user = await userFactory.create({
        password,
        permissions: ['INVITE_USER']
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

      const inviteData = {
        name: faker.person.fullName(),
        user: faker.internet.email(),
        role: 'member',
        permissions: ['VIEW_STUDENT']
      }

      const res = await app.inject({
        url: PATH,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        },
        payload: inviteData
      })

      expect(res.statusCode).toBe(200)
    })

    it('Returns 401 when authorization header is missing', async () => {
      const res = await app.inject({
        url: PATH,
        method: METHOD,
        payload: {
          name: faker.person.fullName(),
          user: faker.internet.email(),
          role: 'member',
          permissions: ['VIEW_STUDENT']
        }
      })

      expect(res.statusCode).toBe(401)
    })

    it('Returns 403 when user lacks INVITE_USER permission', async () => {
      const password = faker.string.alphanumeric(10)
      const user = await userFactory.create({
        role: 'base',
        password,
        permissions: ['VIEW_STUDENT']
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
        },
        payload: {
          name: faker.person.fullName(),
          user: faker.internet.email(),
          role: 'member',
          permissions: ['VIEW_STUDENT']
        }
      })

      expect(res.statusCode).toBe(403)
    })

    it('Returns 400 when required fields are missing', async () => {
      const password = faker.string.alphanumeric(10)
      const user = await userFactory.create({
        password,
        permissions: ['INVITE_USER']
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
        },
        payload: {
          name: faker.person.fullName()
        }
      })

      expect(res.statusCode).toBe(400)
    })

    it('Returns 400 when role is invalid', async () => {
      const password = faker.string.alphanumeric(10)
      const user = await userFactory.create({
        password,
        permissions: ['INVITE_USER']
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
        },
        payload: {
          name: faker.person.fullName(),
          user: faker.internet.email(),
          role: 'invalid_role',
          permissions: ['VIEW_STUDENT']
        }
      })

      expect(res.statusCode).toBe(400)
    })
  })
})

