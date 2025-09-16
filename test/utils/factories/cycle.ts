import { Factory } from 'fishery'
import { Cycle, CreateCycle } from '#src/types/cycles'
import { faker } from '@faker-js/faker'
import connectionManager from '#src/common/bd'

class CycleFactory extends Factory<CreateCycle, null, Cycle> {
}

export const cycleFactory = CycleFactory.define(({ onCreate }) => {
  onCreate(async (cycle) => {
    const result = await connectionManager.getConnection()
      .table('Cycles')
      .insert(cycle)
      .returning('*')
    return result[0]
  })

  return {
    slug: `${faker.date.recent().getFullYear()}${faker.helpers.arrayElement(['A', 'B'])}`,
    isCurrent: false,
    createdAt: new Date(),
    updatedAt: new Date()
  }
})