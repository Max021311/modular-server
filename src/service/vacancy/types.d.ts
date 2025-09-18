import type { UpdateVacancy, CreateVacancy, Vacancy } from '#src/types/vacancy.js'
import type { CyclePicked } from '../cycle/types.js'
import type { DepartmentPicked } from '../department/types.js'

export type VacancyPicked = Pick<Vacancy, 'id'|'name'|'description'|'slots'|'cycleId'|'departmentId'|'disabled'|'createdAt'|'updatedAt'>

export { CreateVacancy, UpdateVacancy } from '#src/types/vacancy.js'

export interface FindAndCountParams {
  limit: number
  offset: number
  order?: [`Vacancies.${keyof Vacancy}`, 'asc' | 'desc']
  search?: string
  includeCycle?: boolean
  includeDepartment?: boolean
  departmentId?: number
  cycleId?: number
  studentId?: number
}

export interface VacancyServiceConfigI {
  textSearch: {
    language: string
  }
}

export interface VacancyWithJoins extends VacancyPicked {
  cycle?: CyclePicked
  department?: DepartmentPicked
}

export interface FindByIdOpts {
  includeCycle?: boolean
  includeDepartment?: boolean
}

export interface VacancyAssociationValidationResult {
  isValid: boolean
  error?: 'STUDENT_HAS_CYCLE_ASSOCIATION' | 'VACANCY_NO_SLOTS' | 'ASSOCIATION_EXISTS'
  message?: string
}

export interface VacancyServiceI {
  findAndCount(params: FindAndCountParams): Promise<{ total: number, records: VacancyWithJoins[] }>
  findById(id: number, opts?: FindByIdOpts): Promise<VacancyWithJoins | null>
  create(vacancy: Omit<CreateVacancy, 'createdAt'|'updatedAt'>): Promise<VacancyPicked>
  update(id: number, vacancy: UpdateVacancy): Promise<VacancyPicked | null>
  validateAssociation(vacancyId: number, studentId: number, vacancyCycleId: number): Promise<VacancyAssociationValidationResult>
  createAssociation(vacancyId: number, studentId: number): Promise<void>
}
