import jwt, { JwtPayload, Jwt } from 'jsonwebtoken'
import configuration from './../common/configuration'

export const TOKEN_SCOPES = {
  USER: 'user'
} as const

export interface UserTokenPayload {
  id: number,
  name: string,
  user: string
  scope: typeof TOKEN_SCOPES.USER
}

declare module 'fastify' {
  interface FastifyRequest {
    user: UserTokenPayload
  }
}

export type DecodedToken = (UserTokenPayload & Jwt & JwtPayload) | undefined

export class JwtService {
  // eslint-disable-next-line no-use-before-define
  private static instance?: JwtService
  readonly secret: string

  constructor () {
    this.secret = configuration.jwtService.secret
  }

  sign (payload: UserTokenPayload, expiresIn: string = '24h'): Promise<string> {
    return new Promise((resolve, reject) => {
      jwt.sign(payload, this.secret, { expiresIn }, (err, token) => {
        if (err) { reject(err) }
        resolve(token as string)
      })
    })
  }

  verify (token: string): Promise<DecodedToken> {
    return new Promise((resolve, reject) => {
      jwt.verify(token, this.secret, (err, decoded) => {
        if (err) { reject(err) }
        resolve(decoded as DecodedToken)
      })
    })
  }
}

const jwtService = new JwtService()
export default jwtService
