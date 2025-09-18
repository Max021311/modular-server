import jwt from 'jsonwebtoken'
import type { SignPayloads, DecodedTokens, JwtServiceConfig, JwtServiceI } from './types.js'
import type { ModuleConstructorParams } from '#src/service/types.js'

type ConstructorParams = ModuleConstructorParams<
  'logger',
  unknown,
  JwtServiceConfig
>

export class JwtService implements JwtServiceI {
  readonly secret: string

  constructor (params: ConstructorParams) {
    this.secret = params.config.secret
  }

  sign (payload: SignPayloads, expiresIn: string = '24h'): Promise<string> {
    return new Promise((resolve, reject) => {
      jwt.sign(payload, this.secret, { expiresIn }, (err, token) => {
        if (err) { reject(err) }
        resolve(token as string)
      })
    })
  }

  verify (token: string): Promise<DecodedTokens> {
    return new Promise((resolve, reject) => {
      jwt.verify(token, this.secret, (err, decoded) => {
        if (err) { reject(err) }
        resolve(decoded as DecodedTokens)
      })
    })
  }
}
