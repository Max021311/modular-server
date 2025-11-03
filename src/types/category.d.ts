interface Category {
  id: number
  name: string
  createdAt: Date
  updatedAt: Date
}

export type CreateCategory = Omit<Category, 'id'>
export type UpdateCategory = Partial<Omit<Category, 'id'|'createdAt'>>
