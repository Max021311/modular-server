export interface Career {
  id: number
  name: string
  slug: string
  createdAt: Date
  updatedAt: Date
}

export type CreateCareer = Omit<Career, 'id'>
export type UpdateCareer = Partial<Omit<Career, 'id'|'createdAt'>>
