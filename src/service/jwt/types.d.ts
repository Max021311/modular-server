import type { JwtPayload, Jwt } from 'jsonwebtoken'
import type TOKEN_SCOPES from '#src/common/token-scopes.js'
import type { Roles, PERMISSIONS } from '#src/common/permissions.js'

export interface UserTokenPayload {
  id: number
  name: string
  user: string
  role: keyof Roles
  permissions: PERMISSIONS[]
  createdAt: Date
  updatedAt: Date
  scope: typeof TOKEN_SCOPES.USER
}

export interface StudentTokenPayload {
  id: number
  name: string
  code: string
  careerId: number
  email: string
  telephone: string
  createdAt: Date
  updatedAt: Date
  scope: typeof TOKEN_SCOPES.STUDENT
}

export interface InviteUserPayload {
  name: string
  user: string
  role: keyof Roles
  permissions: PERMISSIONS[]
  scope: typeof TOKEN_SCOPES.INVITE_USER
}

export interface InviteStudentPayload {
  email: string,
  scope: typeof TOKEN_SCOPES.INVITE_STUDENT
}

type SignPayloads = UserTokenPayload | StudentTokenPayload | InviteStudentPayload | InviteUserPayload

type DecodedToken<T> = T & Jwt & JwtPayload

export type DecodedTokens = DecodedToken<UserTokenPayload> | DecodedToken<InviteStudentPayload> | DecodedToken<InviteUserPayload> | undefined
export interface JwtServiceI {
  sign (payload: SignPayloads, expiresIn: string = '24h'): Promise<string>
  verify (token: string): Promise<DecodedTokens>
}

export interface JwtServiceConfig {
  secret: string
}
