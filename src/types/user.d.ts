import type { Roles, PERMISSIONS } from '#src/common/permissions'

export interface User {
  id: number
  name: string
  user: string
  password: string
  role: keyof Roles
  permissions: PERMISSIONS[]
  createdAt: Date
  updatedAt: Date
}

export type CreateUser = Omit<User, 'id'>
export type UpdateUser = Partial<Omit<User, 'id'|'createdAt'>>
export type UserWithoutPassword = Pick<User, 'id'|'name'|'user'|'role'|'permissions'|'createdAt'|'updatedAt'>
