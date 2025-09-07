export interface Student {
  id: number
  name: string
  code: string
  password: string
  careerId: number
  email: string
  telephone: string
  createdAt: Date
  updatedAt: Date
}

export type CreateStudent = Omit<Student, 'id'>
export type UpdateStudent = Partial<Omit<Student, 'id'|'createdAt'>>
