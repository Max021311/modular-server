import type { JwtPayload, Jwt } from 'jsonwebtoken'
import type TOKEN_SCOPES from '#src/common/token-scopes'

export interface UserTokenPayload {
  id: number
  name: string
  user: string
  permissions: string[]
  createdAt: Date,
  updatedAt: Date
  scope: typeof TOKEN_SCOPES.USER
}

export interface InviteUserPayload {
  email: string,
  scope: typeof TOKEN_SCOPES.INVITE_USER
}

type SignPayloads = UserTokenPayload | InviteUserPayload

declare module 'fastify' {
  interface FastifyRequest {
    user: UserTokenPayload
  }
}

type DecodedToken<T> = T & Jwt & JwtPayload

export type DecodedTokens = DecodedToken<UserTokenPayload> | DecodedToken<InviteUserPayload> | undefined
export interface JwtServiceI {
  sign (payload: SignPayloads, expiresIn: string = '24h'): Promise<string>
  verify (token: string): Promise<DecodedTokens>
}

export interface JwtServiceConfig {
  secret: string
}
