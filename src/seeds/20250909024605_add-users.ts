import { Knex } from 'knex'
import bcrypt from 'bcrypt'
import { faker } from '@faker-js/faker'

export async function seed (knex: Knex): Promise<void> {
  await knex('Users').del()

  const password = await bcrypt.hash('loremipsum', 13)
  await knex('Users').insert([
    {
      name: faker.person.fullName(),
      user: 'example@example.com',
      role: 'admin',
      password,
      permissions: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ])
}
