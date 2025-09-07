import { describe, it, expect, beforeEach, vi } from 'vitest'
import { JwtService } from '#src/service/jwt'
import { UserTokenPayload, InviteUserPayload } from '#src/service/jwt/types'
import TOKEN_SCOPES from '#src/common/token-scopes'
import jwt from 'jsonwebtoken'
import logger from '#src/common/logger'

describe('JwtService', () => {
  const SECRET = 'lorempisum'
  let jwtService: JwtService
  
  beforeEach(() => {
    jwtService = new JwtService({
      context: { logger },
      config: { secret: SECRET }
    })
  })

  describe('constructor', () => {
    it('should initialize with secret from configuration', () => {
      expect(jwtService.secret).toBe(SECRET)
    })
  })

  describe('sign', () => {
    it('should sign a user token payload', async () => {
      const userPayload: UserTokenPayload = {
        id: 1,
        name: 'Test User',
        user: 'test@example.com',
        permissions: ['read', 'write'],
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-02'),
        scope: TOKEN_SCOPES.USER
      }

      const token = await jwtService.sign(userPayload)
      
      expect(typeof token).toBe('string')
      expect(token).toBeTruthy()
      
      const decoded = jwt.verify(token, SECRET) as any
      expect(decoded.id).toBe(1)
      expect(decoded.name).toBe('Test User')
      expect(decoded.user).toBe('test@example.com')
      expect(decoded.scope).toBe(TOKEN_SCOPES.USER)
    })

    it('should sign an invite user token payload', async () => {
      const invitePayload: InviteUserPayload = {
        email: 'invite@example.com',
        scope: TOKEN_SCOPES.INVITE_USER
      }

      const token = await jwtService.sign(invitePayload)
      
      expect(typeof token).toBe('string')
      expect(token).toBeTruthy()
      
      const decoded = jwt.verify(token, SECRET) as any
      expect(decoded.email).toBe('invite@example.com')
      expect(decoded.scope).toBe(TOKEN_SCOPES.INVITE_USER)
    })

    it('should sign with custom expiration time', async () => {
      const userPayload: UserTokenPayload = {
        id: 1,
        name: 'Test User',
        user: 'test@example.com',
        permissions: ['read'],
        createdAt: new Date(),
        updatedAt: new Date(),
        scope: TOKEN_SCOPES.USER
      }

      const token = await jwtService.sign(userPayload, '1h')
      
      const decoded = jwt.verify(token, SECRET) as any
      expect(decoded.exp - decoded.iat).toBe(3600)
    })

    it('should reject when signing fails', async () => {
      const invalidPayload = null as any

      await expect(jwtService.sign(invalidPayload)).rejects.toThrow()
    })
  })

  describe('verify', () => {
    it('should verify and decode a valid user token', async () => {
      const userPayload: UserTokenPayload = {
        id: 1,
        name: 'Test User',
        user: 'test@example.com',
        permissions: ['read', 'write'],
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-02'),
        scope: TOKEN_SCOPES.USER
      }

      const token = await jwtService.sign(userPayload)
      const decoded = await jwtService.verify(token)
      
      expect(decoded).toBeDefined()
      expect(decoded!.id).toBe(1)
      expect(decoded!.name).toBe('Test User')
      expect(decoded!.user).toBe('test@example.com')
      expect(decoded!.scope).toBe(TOKEN_SCOPES.USER)
    })

    it('should verify and decode a valid invite token', async () => {
      const invitePayload: InviteUserPayload = {
        email: 'invite@example.com',
        scope: TOKEN_SCOPES.INVITE_USER
      }

      const token = await jwtService.sign(invitePayload)
      const decoded = await jwtService.verify(token)
      
      expect(decoded).toBeDefined()
      expect((decoded as any).email).toBe('invite@example.com')
      expect(decoded!.scope).toBe(TOKEN_SCOPES.INVITE_USER)
    })

    it('should reject invalid tokens', async () => {
      const invalidToken = 'invalid.token.here'

      await expect(jwtService.verify(invalidToken)).rejects.toThrow()
    })

    it('should reject tokens signed with wrong secret', async () => {
      const token = jwt.sign({ id: 1 }, 'wrong-secret')

      await expect(jwtService.verify(token)).rejects.toThrow()
    })

    it('should reject expired tokens', async () => {
      const expiredToken = jwt.sign({ id: 1 }, SECRET, { expiresIn: '0s' })

      await expect(jwtService.verify(expiredToken)).rejects.toThrow()
    })
  })

  describe('TOKEN_SCOPES', () => {
    it('should have correct scope constants', () => {
      expect(TOKEN_SCOPES.USER).toBe('user')
      expect(TOKEN_SCOPES.INVITE_USER).toBe('invite-user')
    })
  })
})
