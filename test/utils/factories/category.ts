import { Factory } from 'fishery'
import { Category, CreateCategory } from '#src/types/category.js'
import { faker } from '@faker-js/faker'
import connectionManager from '#src/common/bd/index.js'

class CategoryFactory extends Factory<CreateCategory, null, Category> {
}

export const categoryFactory = CategoryFactory.define(({ onCreate }) => {
  onCreate(async (category) => {
    const result = await connectionManager.getConnection()
      .table('Categories')
      .insert(category)
      .returning('*')
    return result[0]
  })

  return {
    name: faker.commerce.department(),
    createdAt: new Date(),
    updatedAt: new Date()
  }
})

