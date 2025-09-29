import type { CreateFinalReport, FinalReport, UpdateFinalReport } from '#src/types/final-report.js'
import type { Cycle } from '#src/types/cycle.js'
import type { Student } from '#src/types/student.js'
import type { Vacancy } from '#src/types/vacancy.js'

export type FinalReportPicked = Pick<FinalReport, 'id'|'studentId'|'vacancyId'|'cycleId'|'status'|'hours'|'fileId'|'createdAt'|'updatedAt'>

export type FinalReportWithJoins = FinalReportPicked & {
  cycle?: Pick<Cycle, 'id'|'slug'|'isCurrent'|'createdAt'|'updatedAt'>
  student?: Pick<Student, 'id'|'name'|'code'|'careerId'|'email'|'telephone'|'createdAt'|'updatedAt'>
  vacancy?: Pick<Vacancy, 'id'|'name'|'description'|'slots'|'cycleId'|'departmentId'|'disabled'|'createdAt'|'updatedAt'>
}

export { CreateFinalReport, UpdateFinalReport } from '#src/types/final-report.js'

export interface FindAndCountParams {
  limit: number
  offset: number
  order?: [`FinalReports.${keyof FinalReport}`, 'asc' | 'desc']
  studentId?: number
  vacancyId?: number
  cycleId?: number
  status?: FinalReport['status']
  includeCycle?: boolean
  includeStudent?: boolean
  includeVacancy?: boolean
}

export interface GetByIdParams {
  includeCycle?: boolean
  includeStudent?: boolean
  includeVacancy?: boolean
}

export interface FinalReportServiceI {
  getById(id: number, params?: GetByIdParams): Promise<FinalReportWithJoins | null>
  findAndCount(params: FindAndCountParams): Promise<{ total: number, records: FinalReportWithJoins[] }>
  create(finalReportData: Omit<CreateFinalReport, 'createdAt' | 'updatedAt'>): Promise<FinalReportPicked>
  update(id: number, finalReportData: Omit<UpdateFinalReport, 'updatedAt'>): Promise<FinalReportPicked>
  delete(id: number): Promise<void>
}
