import type { Career } from '#src/types/career.js'

export type CareerPicked = Pick<Career, 'id'|'name'|'slug'|'createdAt'|'updatedAt'>

export interface FindParams {
  search?: string
  order?: [`Careers.${keyof CareerPicked}`, 'asc' | 'desc']
}

export interface CareerServiceI {
  findAll(params?: FindParams): Promise<CareerPicked[]>
  create(career: Omit<CareerPicked, 'id' | 'createdAt' | 'updatedAt'>): Promise<CareerPicked>
  update(id: number, career: Partial<Omit<CareerPicked, 'id' | 'createdAt' | 'updatedAt'>>): Promise<CareerPicked | null>
}

export interface CareerServiceConfigI {
  textSearch: {
    language: string
  }
}
