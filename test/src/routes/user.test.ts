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

  describe('GET /users', () => {
    const PATH = '/users'
    const METHOD = 'GET'
    
    it('Success get users with pagination', async () => {
      const password = faker.string.alphanumeric(10)
      const authenticatedUser = await userFactory.create({
        password,
        permissions: ['VIEW_USER']
      })
      
      const token = await jwtService.sign({
        id: authenticatedUser.id,
        name: authenticatedUser.name,
        user: authenticatedUser.user,
        role: authenticatedUser.role,
        permissions: authenticatedUser.permissions,
        createdAt: authenticatedUser.createdAt,
        updatedAt: authenticatedUser.updatedAt,
        scope: 'user'
      })

      // Create additional users
      await Promise.all([
        userFactory.create(),
        userFactory.create(),
        userFactory.create()
      ])

      const res = await app.inject({
        url: PATH,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        },
        query: {
          limit: '5',
          offset: '0'
        }
      })
      
      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body).toHaveProperty('total')
      expect(body).toHaveProperty('records')
      expect(body.records).toBeInstanceOf(Array)
      expect(body.total).toBeGreaterThanOrEqual(4) // At least 4 users (authenticated + 3 created)
      
      const userRecord = body.records.find((u: any) => u.id === authenticatedUser.id)
      expect(userRecord).toBeDefined()
      expect(userRecord).toHaveProperty('id', authenticatedUser.id)
      expect(userRecord).toHaveProperty('name', authenticatedUser.name)
      expect(userRecord).toHaveProperty('user', authenticatedUser.user)
      expect(userRecord).toHaveProperty('role', authenticatedUser.role)
      expect(userRecord).toHaveProperty('permissions')
      expect(userRecord).toHaveProperty('createdAt')
      expect(userRecord).toHaveProperty('updatedAt')
    })

    it('Success get users with search', async () => {
      const password = faker.string.alphanumeric(10)
      const authenticatedUser = await userFactory.create({
        password,
        permissions: ['VIEW_USER']
      })
      
      const searchUser = await userFactory.create({
        name: 'John Doe Search Test',
        user: 'johndoe@search.test'
      })
      
      const token = await jwtService.sign({
        id: authenticatedUser.id,
        name: authenticatedUser.name,
        user: authenticatedUser.user,
        role: authenticatedUser.role,
        permissions: authenticatedUser.permissions,
        createdAt: authenticatedUser.createdAt,
        updatedAt: authenticatedUser.updatedAt,
        scope: 'user'
      })

      const res = await app.inject({
        url: PATH,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        },
        query: {
          search: 'johndoe'
        }
      })
      
      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.records).toBeInstanceOf(Array)
      
      const foundUser = body.records.find((u: any) => u.id === searchUser.id)
      expect(foundUser).toBeDefined()
    })

    it('Success get users with ordering', async () => {
      const password = faker.string.alphanumeric(10)
      const authenticatedUser = await userFactory.create({
        password,
        permissions: ['VIEW_USER']
      })
      
      const token = await jwtService.sign({
        id: authenticatedUser.id,
        name: authenticatedUser.name,
        user: authenticatedUser.user,
        role: authenticatedUser.role,
        permissions: authenticatedUser.permissions,
        createdAt: authenticatedUser.createdAt,
        updatedAt: authenticatedUser.updatedAt,
        scope: 'user'
      })

      const res = await app.inject({
        url: PATH,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        },
        query: {
          order: 'Users.name'
        }
      })
      
      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.records).toBeInstanceOf(Array)
    })

    it('Returns 401 when authorization header is missing', async () => {
      const res = await app.inject({
        url: PATH,
        method: METHOD
      })

      expect(res.statusCode).toBe(401)
    })

    it('Returns 403 when user lacks VIEW_USER permission', async () => {
      const password = faker.string.alphanumeric(10)
      const user = await userFactory.create({
        password,
        permissions: ['VIEW_STUDENT'] // Different permission
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

    it('Returns 400 when limit exceeds maximum', async () => {
      const password = faker.string.alphanumeric(10)
      const authenticatedUser = await userFactory.create({
        password,
        permissions: ['VIEW_USER']
      })
      
      const token = await jwtService.sign({
        id: authenticatedUser.id,
        name: authenticatedUser.name,
        user: authenticatedUser.user,
        role: authenticatedUser.role,
        permissions: authenticatedUser.permissions,
        createdAt: authenticatedUser.createdAt,
        updatedAt: authenticatedUser.updatedAt,
        scope: 'user'
      })

      const res = await app.inject({
        url: PATH,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        },
        query: {
          limit: '100' // Exceeds maximum of 50
        }
      })

      expect(res.statusCode).toBe(400)
    })

    it('Returns 400 when order parameter is invalid', async () => {
      const password = faker.string.alphanumeric(10)
      const authenticatedUser = await userFactory.create({
        password,
        permissions: ['VIEW_USER']
      })
      
      const token = await jwtService.sign({
        id: authenticatedUser.id,
        name: authenticatedUser.name,
        user: authenticatedUser.user,
        role: authenticatedUser.role,
        permissions: authenticatedUser.permissions,
        createdAt: authenticatedUser.createdAt,
        updatedAt: authenticatedUser.updatedAt,
        scope: 'user'
      })

      const res = await app.inject({
        url: PATH,
        method: METHOD,
        headers: {
          authorization: `Bearer ${token}`
        },
        query: {
          order: 'invalid_field'
        }
      })

      expect(res.statusCode).toBe(400)
    })
  })
})

