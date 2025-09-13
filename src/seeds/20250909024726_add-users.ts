import { Knex } from 'knex'
import bcrypt from 'bcrypt'
import { faker } from '@faker-js/faker'

export async function seed (knex: Knex): Promise<void> {
  await knex('Users').del()

  const password = await bcrypt.hash('loremipsum', 13)
  const createStudent = () => ({
    name: faker.person.fullName(),
    code: faker.string.numeric(9),
    email: faker.internet.email(),
    password,
    telephone: faker.phone.number({ style: 'national' }),
    careerId: faker.helpers.arrayElement([1, 2, 3, 4]),
    createdAt: new Date(),
    updatedAt: new Date()
  })
  await knex('Students').insert([
    { // ID: 1
      name: faker.person.fullName(),
      user: 'example@example.com',
      role: 'admin',
      password,
      permissions: ['READ', 'CREATE', 'DELETE', 'UPDATE'],
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ])
  const students = Array.from({ length: 50 }).map(() => createStudent())
  await knex('Students').insert(students)
};
