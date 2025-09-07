import { HttpError } from '#src/common/error'
import bcrypt from 'bcrypt'
import type { UserTokenPayload } from '#src/service/jwt/types'
import TOKEN_SCOPES from '#src/common/token-scopes'
import type { UserServiceI } from './types'
import type { ModuleConstructorParams } from '#src/service/types'

type ConstructorParams = ModuleConstructorParams<
  'logger'|'services'|'connectionManager',
  'jwtService'
>

export class UserService implements UserServiceI {
  private readonly services: ConstructorParams['context']['services']
  private readonly connectionManager: ConstructorParams['context']['connectionManager']

  constructor (params: ConstructorParams) {
    this.services = params.context.services
    this.connectionManager = params.context.connectionManager
  }

  private get db () {
    return this.connectionManager.getConnection()
  }

  private users () {
    return this.db.table('Users').select('id', 'name', 'user', 'permissions', 'createdAt', 'updatedAt')
  }

  /**
   * @throws {HttpError}
  */
  async login (email: string, password: string): Promise<string> {
    const user = await this.users().select('password').first().where('user', email)
    if (!user) { throw new HttpError('Wrong user or password', 401) }

    const result = await bcrypt.compare(password, user.password)
    if (!result) { throw new HttpError('Wrong user or password', 401) }

    return await this.services.jwtService().sign({
      id: user.id,
      name: user.name,
      user: user.user,
      permissions: user.permissions,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      scope: 'user'
    })
  }

  async getById (id: number) {
    return await this.users()
      .first()
      .where('id', id)
  }

  async getByEmail (email: string) {
    return await this.users()
      .first()
      .where('user', email)
  }

  async verifyUserToken (jwt: string) {
    const payload = await this.services.jwtService().verify(jwt)
    if (payload === undefined) { throw new HttpError('Invalid token', 401) }
    if (payload.scope !== TOKEN_SCOPES.USER) { throw new HttpError('Invalid token scope', 401) }
    return payload as UserTokenPayload
  }
}
