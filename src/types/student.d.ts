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
  searchVector: string
}

export type CreateStudent = Omit<Student, 'id'|'searchVector'>
export type UpdateStudent = Partial<Omit<Student, 'id'|'createdAt'|'searchVector'>>
