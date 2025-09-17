import type { CreateVacancy, Vacancy } from '#src/types/vacancy'
import type { Department } from '#src/types/departments'
import type { Cycle } from '#src/types/cycles'

export type VacancyPicked = Pick<Vacancy, 'id'|'name'|'description'|'slots'|'cycleId'|'departmentId'|'disabled'|'createdAt'|'updatedAt'>

export { CreateVacancy, UpdateVacancy } from '#src/types/vacancy'

export interface FindAndCountParams {
  limit: number
  offset: number
  order?: [`Vacancies.${keyof Vacancy}`, 'asc' | 'desc']
  search?: string
  includeCycle?: boolean
  includeDepartment?: boolean
  departmentId?: number
  cycleId?: number
}

export interface VacancyServiceConfigI {
  textSearch: {
    language: string
  }
}

export interface VacancyWithJoins extends VacancyPicked {
  cycle?: Pick<Cycle, 'id'|'slug'|'isCurrent'>
  department?: Pick<Department, 'id'|'name'>
}

export interface FindByIdOpts {
  includeCycle?: boolean
  includeDepartment?: boolean
}

export interface VacancyServiceI {
  findAndCount(params: FindAndCountParams): Promise<{ total: number, records: VacancyWithJoins[] }>
  findById(id: number, opts?: FindByIdOpts): Promise<VacancyWithJoins | null>
  create(vacancy: Omit<CreateVacancy, 'createdAt'|'updatedAt'>): Promise<VacancyPicked>
}
