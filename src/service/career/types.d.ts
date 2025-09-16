import type { Career } from '#src/types/career'

export { Career } from '#src/types/career'

export interface CareerServiceI {
  findAll(): Promise<Career[]>
}
