import { Knex } from 'knex'
import { faker } from '@faker-js/faker'

export async function seed (knex: Knex): Promise<void> {
  await knex('Files').del()

  const createFile = () => ({
    name: faker.lorem.slug({ min: 2, max: 5 }),
    createdAt: new Date(),
    updatedAt: new Date()
  })
  const files = Array.from({ length: 50 }).map(() => createFile())
  await knex('Files').insert(files)
};
