import { HttpError } from '../common/error'
import bcrypt from 'bcrypt'
import jwtService, { TOKEN_SCOPES } from './jwt'

const HASH = '$2b$15$ri/VHX2oGZjWTH0Ve4tEYOHoD1dg0N2iZo6Kd6WIy/S.gp30SSlOG'

export class UserService {
  /**
   * @throws {HttpError}
  */
  async login (email: string, password: string): Promise<string> {
    const result = await bcrypt.compare(password, HASH)
    if (!result) { throw new HttpError('Wrong user or password', 401) }
    return await jwtService.sign({
      id: 1,
      name: 'Loremipsum dolor sit amet',
      user: 'example@example.com',
      scope: 'user'
    })
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
