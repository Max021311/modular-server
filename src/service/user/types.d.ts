import { User, CreateUser } from '#src/types/user'

export { CreateUser } from '#src/types/user'

type UserWithoutPassword = Pick<User, 'id'|'name'|'user'|'permissions'|'createdAt'|'updatedAt'>

export interface UserServiceI {
  login (email: string, password: string): Promise<string>
  getById (id: number): Promise<UserWithoutPassword | undefined>
  getByEmail (email: string): Promise<UserWithoutPassword | undefined>
  verifyUserToken (jwt: string): Promise<UserWithoutPassword>
  create(user: CreateUser): Promise<UserWithoutPassword>
}
