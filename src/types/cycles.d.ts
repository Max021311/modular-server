interface Cycle {
  id: number
  slug: string // 2024A, 2024B, etc.
  isCurrent: boolean
  createdAt: Date
  updatedAt: Date
}

export type CreateCycle = Omit<Cycle, 'id'>
export type UpdateCycle = Omit<Cycle, 'id'|'createdAt'>
