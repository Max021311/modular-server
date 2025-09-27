import type { CreateUser, UserWithoutPassword } from '#src/types/user.js'

export { CreateUser } from '#src/types/user'

export interface FindAndCountParams {
  limit?: number
  offset?: number
  search?: string
  order?: [`Users.${keyof UserWithoutPassword}`, 'asc' | 'desc']
}

export interface UserServiceI {
  login (email: string, password: string): Promise<string>
  getById (id: number): Promise<UserWithoutPassword | undefined>
  getByEmail (email: string): Promise<UserWithoutPassword | undefined>
  verifyUserToken (jwt: string): Promise<UserWithoutPassword>
  create(user: CreateUser): Promise<UserWithoutPassword>
  findAndCount(params?: FindAndCountParams): Promise<{ records: UserWithoutPassword[]; total: number }>
}

export interface UserServiceConfigI {
  textSearch: {
    language: string
  }
}
