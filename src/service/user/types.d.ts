import { User } from '#src/types/user'
import { UserTokenPayload } from '#src/service/jwt/types'

type UserWithoutPassword = Pick<User, 'id'|'name'|'user'|'permissions'|'createdAt'|'updatedAt'>

export interface UserServiceI {
  login (email: string, password: string): Promise<string>
  getById (id: number): Promise<UserWithoutPassword | undefined>
  getByEmail (email: string): Promise<UserWithoutPassword | undefined>
  verifyUserToken (jwt: string): Promise<UserTokenPayload>
}
