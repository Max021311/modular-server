import type { CreateStudent, Student, UpdateStudent } from '#src/types/student'
import type { Career } from '#src/types/career'

export { CreateStudent, UpdateStudent } from '#src/types/student'

export type StudentWithouPasswordFields = 'id'|'name'|'code'|'careerId'|'email'|'telephone'|'createdAt'|'updatedAt'

export type StudentWithouPassword = Pick<Student, StudentWithouPasswordFields>

export type StudentWithCareer = StudentWithouPassword & {
  career?: Career
}

export interface FindAndCountParams {
  limit: number
  offset: number
  order?: [`Students.${keyof Student}`, 'asc' | 'desc']
  includeCareer?: boolean
}

export interface FindByIdOpts {
  includeCareer?: boolean
}

export interface StudentServiceI {
  login (email: string, password: string): Promise<string>
  createStudent(studentData: CreateStudent): Promise<StudentWithouPassword>
  findAndCount (params: FindAndCountParams): Promise<{ total: number, records: StudentWithCareer[] }>
  updateStudent(id: number, studentData: UpdateStudent): Promise<StudentWithouPassword>
  findById(id: number, opts?: FindByIdOpts): Promise<StudentWithCareer | null>
}
