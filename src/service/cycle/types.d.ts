import type { CreateCycle, Cycle, UpdateCycle } from '#src/types/cycles.js'

export type CyclePicked = Pick<Cycle, 'id'|'slug'|'isCurrent'|'createdAt'|'updatedAt'>

export { CreateCycle, UpdateCycle } from '#src/types/cycles.js'

export interface FindAndCountParams {
  limit: number
  offset: number
  order?: [`Cycles.${keyof Cycle}`, 'asc' | 'desc']
  search?: string
}

export interface CycleServiceI {
  findById(id: number): Promise<CyclePicked | null>
  findBySlug(slug: string): Promise<CyclePicked | null>
  findCurrent(): Promise<CyclePicked | null>
  findAndCountAll(params: FindAndCountParams): Promise<{ total: number, records: CyclePicked[] }>
  create(cycleData: Omit<CreateCycle, 'createdAt' | 'updatedAt'>): Promise<CyclePicked>
  update(id: number, cycleData: Partial<Omit<UpdateCycle, 'updatedAt'>>): Promise<CyclePicked>
  setCurrent(id: number): Promise<CyclePicked>
}
