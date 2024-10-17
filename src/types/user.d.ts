export interface User {
  id: number
  name: string
  user: string
  password: string
  permissions: string[]
  createdAt: Date
  updatedAt: Date
}

export type CreateUser = Omit<User, 'id'>
export type UpdateUser = Partial<Omit<User, 'id'|'createdAt'>>
