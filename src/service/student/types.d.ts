import type { CreateStudent, Student, UpdateStudent } from '#src/types/student'

export { CreateStudent, UpdateStudent } from '#src/types/student'

export type StudentWithouPasswordFields = 'id'|'name'|'code'|'careerId'|'email'|'telephone'|'createdAt'|'updatedAt'

export type StudentWithouPassword = Pick<Student, StudentWithouPasswordFields>

export interface FindAndCountParams {
  limit: number
  offset: number
  order?: [keyof Student, 'asc' | 'desc']
}

export interface StudentServiceI {
  createStudent(studentData: CreateStudent): Promise<StudentWithouPassword>
  findAndCount (params: FindAndCountParams): Promise<{ total: number, records: StudentWithouPassword[] }>
  updateStudent(id: number, studentData: UpdateStudent): Promise<StudentWithouPassword>
}
