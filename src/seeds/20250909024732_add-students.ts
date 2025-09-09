import { Knex } from 'knex'
import bcrypt from 'bcrypt'
import { faker } from '@faker-js/faker'

export async function seed (knex: Knex): Promise<void> {
  await knex('Students').del()

  const password = await bcrypt.hash('loremipsum', 13)
  await knex('Students').insert([
    { // ID: 1
      name: faker.person.fullName(),
      code: '220793481',
      email: 'example+student@example.com',
      password,
      telephone: faker.phone.number({ style: 'national' }),
      careerId: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ])
};
