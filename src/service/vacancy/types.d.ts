import type { UpdateVacancy, CreateVacancy, Vacancy } from '#src/types/vacancy.js'
import type { CyclePicked } from '../cycle/types.js'
import type { DepartmentPicked } from '../department/types.js'
import type { CategoryPicked } from '../category/types.js'
export type VacancyPicked = Pick<Vacancy, 'id'|'name'|'description'|'slots'|'cycleId'|'departmentId'|'disabled'|'categoryId'|'location'|'schedule'|'mode'|'createdAt'|'updatedAt'|'deletedAt'>

export { CreateVacancy, UpdateVacancy } from '#src/types/vacancy.js'

export interface FindAndCountParams {
  id?: number[]
  limit: number
  offset: number
  order?: [`Vacancies.${keyof Vacancy}`, 'asc' | 'desc']
  search?: string
  includeCycle?: boolean
  includeDepartment?: boolean
  includeCategory?: boolean
  includeUsedSlots?: boolean
  departmentId?: number
  cycleId?: number
  studentId?: number
  categoryId?: number
  location?: 'north' | 'south' | 'east' | 'west' | 'center'
  schedule?: 'morning' | 'afternoon' | 'saturday'
  disabled?: boolean
}

export interface VacancyServiceConfigI {
  textSearch: {
    language: string
  }
}

export interface VacancyWithJoins extends VacancyPicked {
  cycle?: CyclePicked
  department?: DepartmentPicked
  category?: CategoryPicked
  usedSlots?: number
}

export interface FindByIdOpts {
  includeCycle?: boolean
  includeDepartment?: boolean
  includeCategory?: boolean
  includeUsedSlots?: boolean
}

export interface FindByIdsOpts {
  includeCycle?: boolean
  includeDepartment?: boolean
  includeCategory?: boolean
  includeUsedSlots?: boolean
}

export interface VacancyAssociationValidationResult {
  isValid: boolean
  error?: 'STUDENT_HAS_CYCLE_ASSOCIATION' | 'VACANCY_NO_SLOTS' | 'ASSOCIATION_EXISTS'
  message?: string
}

export interface VacancyToStudentAssociation {
  id: number
  studentId: number
  vacancyId: number
  createdAt: Date
  updatedAt: Date
}

export interface VacancyServiceI {
  findAndCount(params: FindAndCountParams): Promise<{ total: number, records: VacancyWithJoins[] }>
  findById(id: number, opts?: FindByIdOpts): Promise<VacancyWithJoins | null>
  findByIds(ids: number[], opts?: FindByIdsOpts): Promise<VacancyWithJoins[]>
  create(vacancy: Omit<CreateVacancy, 'createdAt'|'updatedAt'>): Promise<VacancyPicked>
  update(id: number, vacancy: UpdateVacancy): Promise<VacancyPicked>
  validateAssociation(vacancyId: number, studentId: number, vacancyCycleId: number): Promise<VacancyAssociationValidationResult>
  createAssociation(vacancyId: number, studentId: number): Promise<void>
  getAssociation(studentId: number, vacancyId: number): Promise<VacancyToStudentAssociation | null>
}
