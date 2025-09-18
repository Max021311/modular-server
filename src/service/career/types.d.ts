import type { Career } from '#src/types/career.js'

export { Career } from '#src/types/career.js'

export interface CareerServiceI {
  findAll(): Promise<Career[]>
}
