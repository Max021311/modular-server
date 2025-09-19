import type { CreateComissionOffice, ComissionOffice, UpdateComissionOffice } from '#src/types/comission-office.js'
import type { Cycle } from '#src/types/cycle.js'
import type { Student } from '#src/types/student.js'
import type { Vacancy } from '#src/types/vacancy.js'

export type ComissionOfficePicked = Pick<ComissionOffice, 'id'|'studentId'|'vacancyId'|'cycleId'|'beginDate'|'status'|'fileId'|'createdAt'|'updatedAt'>

export type ComissionOfficeWithJoins = ComissionOfficePicked & {
  cycle?: Pick<Cycle, 'id'|'slug'|'isCurrent'|'createdAt'|'updatedAt'>
  student?: Pick<Student, 'id'|'name'|'code'|'careerId'|'email'|'telephone'|'createdAt'|'updatedAt'>
  vacancy?: Pick<Vacancy, 'id'|'name'|'description'|'slots'|'cycleId'|'departmentId'|'disabled'|'createdAt'|'updatedAt'>
}

export { CreateComissionOffice, UpdateComissionOffice } from '#src/types/comission-office.js'

export interface FindAndCountParams {
  limit: number
  offset: number
  order?: [`ComissionOffices.${keyof ComissionOffice}`, 'asc' | 'desc']
  studentId?: number
  vacancyId?: number
  cycleId?: number
  status?: ComissionOffice['status']
  includeCycle?: boolean
  includeStudent?: boolean
  includeVacancy?: boolean
}

export interface ComissionOfficeServiceI {
  getById(id: number): Promise<ComissionOfficePicked | null>
  findAndCount(params: FindAndCountParams): Promise<{ total: number, records: ComissionOfficeWithJoins[] }>
  create(comissionOfficeData: Omit<CreateComissionOffice, 'createdAt' | 'updatedAt'>): Promise<ComissionOfficePicked>
  update(id: number, comissionOfficeData: Omit<UpdateComissionOffice, 'updatedAt'>): Promise<ComissionOfficePicked>
}
