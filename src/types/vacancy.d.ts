interface Vacancy {
  id: number
  name: string
  description: string
  slots: number
  cycleId: number
  departmentId: number
  disabled: boolean
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
  searchVector: string
}

export type CreateVacancy = Omit<Vacancy, 'id'|'searchVector'|'deletedAt'>
export type UpdateVacancy = Partial<Omit<Vacancy, 'id'|'createdAt'|'searchVector'|'cycleId'|'departmentId'>>
