import type { CreateReport, Report, UpdateReport } from '#src/types/report.js'
import type { Cycle } from '#src/types/cycle.js'
import type { Student } from '#src/types/student.js'
import type { Vacancy } from '#src/types/vacancy.js'

export type ReportPicked = Pick<Report, 'id'|'studentId'|'vacancyId'|'cycleId'|'reportNumber'|'status'|'hours'|'fileId'|'createdAt'|'updatedAt'>

export type ReportWithJoins = ReportPicked & {
  cycle?: Pick<Cycle, 'id'|'slug'|'isCurrent'|'createdAt'|'updatedAt'>
  student?: Pick<Student, 'id'|'name'|'code'|'careerId'|'email'|'telephone'|'createdAt'|'updatedAt'>
  vacancy?: Pick<Vacancy, 'id'|'name'|'description'|'slots'|'cycleId'|'departmentId'|'disabled'|'createdAt'|'updatedAt'>
}

export { CreateReport, UpdateReport } from '#src/types/report.js'

export interface FindAndCountParams {
  limit: number
  offset: number
  order?: [`Reports.${keyof Report}`, 'asc' | 'desc']
  studentId?: number
  vacancyId?: number
  cycleId?: number
  reportNumber?: Report['reportNumber']
  status?: Report['status']
  includeCycle?: boolean
  includeStudent?: boolean
  includeVacancy?: boolean
}

export interface GetByIdParams {
  includeCycle?: boolean
  includeStudent?: boolean
  includeVacancy?: boolean
}

export interface ReportServiceI {
  getById(id: number, params?: GetByIdParams): Promise<ReportWithJoins | null>
  findAndCount(params: FindAndCountParams): Promise<{ total: number, records: ReportWithJoins[] }>
  create(reportData: Omit<CreateReport, 'createdAt' | 'updatedAt'>): Promise<ReportPicked>
  update(id: number, reportData: Omit<UpdateReport, 'updatedAt'>): Promise<ReportPicked>
  delete(id: number): Promise<void>
}
