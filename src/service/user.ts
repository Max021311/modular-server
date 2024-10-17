import { HttpError } from '../common/error'
import bcrypt from 'bcrypt'
import jwtService, { TOKEN_SCOPES } from './jwt'
import knex from './../common/bd'

const Users = () => knex('Users')
  .select('id', 'name', 'user', 'permissions', 'createdAt', 'updatedAt')

export class UserService {
  /**
   * @throws {HttpError}
  */
  async login (email: string, password: string): Promise<string> {
    const user = await Users().select('password').first().where('user', email)
    if (!user) { throw new HttpError('Wrong user or password', 401) }

    const result = await bcrypt.compare(password, user.password)
    if (!result) { throw new HttpError('Wrong user or password', 401) }

    return await jwtService.sign({
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
    return Users()
      .first()
      .where('id', id)
  }

  async getByEmail (email: string) {
    return Users()
      .first()
      .where('user', email)
  }

  async verifyUserToken (jwt: string) {
    const payload = await jwtService.verify(jwt)
    if (payload === undefined) { throw new HttpError('Invalid token', 401) }
    if (payload.scope !== TOKEN_SCOPES.USER) { throw new HttpError('Invalid token scope', 401) }
    return payload
  }
}

const userService = new UserService()
export default userService
