import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { UserService } from '#src/service/user'
import { HttpError } from '#src/common/error'
import bcrypt from 'bcrypt'
import { JwtServiceI } from '#src/service/jwt/types'
import TOKEN_SCOPES from '#src/common/token-scopes'
import logger from '#src/common/logger'
import { ConnectionManager } from '#src/common/bd'

const hoisted = vi.hoisted(() => {
  function createMockedQueryBuilder () {
    return {
      table: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      first: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis()
    }
  }
  return {
    createMockedQueryBuilder,
    mockQueryBuilder: createMockedQueryBuilder()
  }
})

// Create mock query builder

// Mock dependencies
vi.mock('bcrypt')
vi.mock('../jwt')
vi.mock('../../common/bd', () => {
  const mockKnex = () => hoisted.mockQueryBuilder
  return { default: mockKnex }
})


describe('UserService', () => {
  let userService: UserService
  const mockBcrypt = vi.mocked(bcrypt)
  const mockConnectionManager = vi.mocked<ConnectionManager>({
    withTransaction: vi.fn(),
    // @ts-expect-error type mismatch between knex and mocked value
    getConnection: vi.fn(() => hoisted.mockQueryBuilder)
  })
  const mockJwtService = vi.mocked<JwtServiceI>({
    sign: vi.fn(),
    verify: vi.fn()
  })

  beforeEach(() => {
    userService = new UserService({
      context: {
        logger,
        services: { jwtService: () => mockJwtService },
        connectionManager: mockConnectionManager
      }
    })

    hoisted.mockQueryBuilder = hoisted.createMockedQueryBuilder()
    
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('login', () => {
    const mockUser = {
      id: 1,
      name: 'Test User',
      user: 'test@example.com',
      password: 'hashedpassword',
      permissions: ['read', 'write'],
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-02')
    }

    it('should successfully login with correct credentials', async () => {
      hoisted.mockQueryBuilder.where.mockResolvedValue(mockUser)
      mockBcrypt.compare.mockResolvedValue(true as never)
      mockJwtService.sign.mockResolvedValue('jwt-token')

      const result = await userService.login('test@example.com', 'password')

      expect(hoisted.mockQueryBuilder.select).toHaveBeenCalledWith('password')
      expect(hoisted.mockQueryBuilder.first).toHaveBeenCalled()
      expect(hoisted.mockQueryBuilder.where).toHaveBeenCalledWith('user', 'test@example.com')
      expect(mockBcrypt.compare).toHaveBeenCalledWith('password', 'hashedpassword')
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        id: 1,
        name: 'Test User',
        user: 'test@example.com',
        permissions: ['read', 'write'],
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-02'),
        scope: 'user'
      })
      expect(result).toBe('jwt-token')
    })

    it('should throw HttpError when user not found', async () => {
      hoisted.mockQueryBuilder.where.mockResolvedValue(undefined)

      await expect(userService.login('nonexistent@example.com', 'password'))
        .rejects.toThrow(new HttpError('Wrong user or password', 401))

      expect(mockBcrypt.compare).not.toHaveBeenCalled()
      expect(mockJwtService.sign).not.toHaveBeenCalled()
    })

    it('should throw HttpError when password is incorrect', async () => {
      hoisted.mockQueryBuilder.where.mockResolvedValue(mockUser)
      mockBcrypt.compare.mockResolvedValue(false as never)

      await expect(userService.login('test@example.com', 'wrongpassword'))
        .rejects.toThrow(new HttpError('Wrong user or password', 401))

      expect(mockBcrypt.compare).toHaveBeenCalledWith('wrongpassword', 'hashedpassword')
      expect(mockJwtService.sign).not.toHaveBeenCalled()
    })

    it('should handle database errors', async () => {
      const dbError = new Error('Database connection failed')
      hoisted.mockQueryBuilder.where.mockRejectedValue(dbError)

      await expect(userService.login('test@example.com', 'password'))
        .rejects.toThrow(dbError)
    })
  })

  describe('getById', () => {
    const mockUser = {
      id: 1,
      name: 'Test User',
      user: 'test@example.com',
      permissions: ['read', 'write'],
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-02')
    }

    it('should return user by id', async () => {
      hoisted.mockQueryBuilder.where.mockResolvedValue(mockUser)

      const result = await userService.getById(1)

      expect(hoisted.mockQueryBuilder.select).toHaveBeenCalledWith('id', 'name', 'user', 'permissions', 'createdAt', 'updatedAt')
      expect(hoisted.mockQueryBuilder.first).toHaveBeenCalled()
      expect(hoisted.mockQueryBuilder.where).toHaveBeenCalledWith('id', 1)
      expect(result).toEqual(mockUser)
    })

    it('should return undefined when user not found', async () => {
      hoisted.mockQueryBuilder.where.mockResolvedValue(undefined)

      const result = await userService.getById(999)

      expect(hoisted.mockQueryBuilder.where).toHaveBeenCalledWith('id', 999)
      expect(result).toBeUndefined()
    })

    it('should handle database errors', async () => {
      const dbError = new Error('Database connection failed')
      hoisted.mockQueryBuilder.where.mockRejectedValue(dbError)

      await expect(userService.getById(1))
        .rejects.toThrow(dbError)
    })
  })

  describe('getByEmail', () => {
    const mockUser = {
      id: 1,
      name: 'Test User',
      user: 'test@example.com',
      permissions: ['read', 'write'],
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-02')
    }

    it('should return user by email', async () => {
      hoisted.mockQueryBuilder.where.mockResolvedValue(mockUser)

      const result = await userService.getByEmail('test@example.com')

      expect(hoisted.mockQueryBuilder.select).toHaveBeenCalledWith('id', 'name', 'user', 'permissions', 'createdAt', 'updatedAt')
      expect(hoisted.mockQueryBuilder.first).toHaveBeenCalled()
      expect(hoisted.mockQueryBuilder.where).toHaveBeenCalledWith('user', 'test@example.com')
      expect(result).toEqual(mockUser)
    })

    it('should return undefined when user not found', async () => {
      hoisted.mockQueryBuilder.where.mockResolvedValue(undefined)

      const result = await userService.getByEmail('nonexistent@example.com')

      expect(hoisted.mockQueryBuilder.where).toHaveBeenCalledWith('user', 'nonexistent@example.com')
      expect(result).toBeUndefined()
    })

    it('should handle database errors', async () => {
      const dbError = new Error('Database connection failed')
      hoisted.mockQueryBuilder.where.mockRejectedValue(dbError)

      await expect(userService.getByEmail('test@example.com'))
        .rejects.toThrow(dbError)
    })
  })

  describe('verifyUserToken', () => {
    const mockPayload = {
      id: 1,
      name: 'Test User',
      user: 'test@example.com',
      permissions: ['read', 'write'],
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-02'),
      scope: TOKEN_SCOPES.USER
    }

    it('should verify valid user token', async () => {
      mockJwtService.verify.mockResolvedValue(mockPayload)

      const result = await userService.verifyUserToken('valid-jwt-token')

      expect(mockJwtService.verify).toHaveBeenCalledWith('valid-jwt-token')
      expect(result).toEqual(mockPayload)
    })

    it('should throw HttpError when token verification returns undefined', async () => {
      mockJwtService.verify.mockResolvedValue(undefined)

      await expect(userService.verifyUserToken('invalid-token'))
        .rejects.toThrow(new HttpError('Invalid token', 401))
    })

    it('should throw HttpError when token has invalid scope', async () => {
      const invalidScopePayload = { ...mockPayload, scope: TOKEN_SCOPES.INVITE_USER }
      mockJwtService.verify.mockResolvedValue(invalidScopePayload as any)

      await expect(userService.verifyUserToken('token-with-invalid-scope'))
        .rejects.toThrow(new HttpError('Invalid token scope', 401))
    })

    it('should handle JWT verification errors', async () => {
      const jwtError = new Error('JWT verification failed')
      mockJwtService.verify.mockRejectedValue(jwtError)

      await expect(userService.verifyUserToken('malformed-token'))
        .rejects.toThrow(jwtError)
    })
  })
})
