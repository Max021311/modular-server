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
  deletedAt: Date | null
  searchVector: string
}

export type CreateStudent = Omit<Student, 'id'|'searchVector'|'deletedAt'>
export type UpdateStudent = Partial<Omit<Student, 'id'|'createdAt'|'searchVector'>>
