import type { Roles, PERMISSIONS } from '#src/common/permissions.js'

export interface User {
  id: number
  name: string
  user: string
  password: string
  role: keyof Roles
  permissions: PERMISSIONS[]
  createdAt: Date
  updatedAt: Date
  search_vector: string
}

export type CreateUser = Omit<User, 'id' | 'search_vector'>
export type UpdateUser = Partial<Omit<User, 'id'|'createdAt'|'search_vector'>>
export type UserWithoutPassword = Pick<User, 'id'|'name'|'user'|'role'|'permissions'|'createdAt'|'updatedAt'>
