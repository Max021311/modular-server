export interface Career {
  id: number
  name: string
  slug: string
  createdAt: Date
  updatedAt: Date
  search_vector: string
}

export type CreateCareer = Omit<Career, 'id'|'search_vector'>
export type UpdateCareer = Partial<Omit<Career, 'id'|'createdAt'|'search_vector'>>
