import type { Category, CreateCategory, UpdateCategory } from '#src/types/category.js'

export type CategoryPicked = Pick<Category, 'id'|'name'|'createdAt'|'updatedAt'>

export { CreateCategory, UpdateCategory } from '#src/types/category.js'

export interface FindParams {
  search?: string
  order?: [`Categories.${keyof CategoryPicked}`, 'asc' | 'desc']
}

export interface CategoryServiceI {
  get(id: number): Promise<CategoryPicked | null>
  findAll(params?: FindParams): Promise<CategoryPicked[]>
  create(categoryData: Omit<CreateCategory, 'createdAt' | 'updatedAt'>): Promise<CategoryPicked>
  update(id: number, categoryData: Partial<Omit<UpdateCategory, 'updatedAt'>>): Promise<CategoryPicked>
}

export interface CategoryServiceConfigI {
  textSearch: {
    language: string
  }
}
