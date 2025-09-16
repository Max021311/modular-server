import { Knex } from 'knex'
import { faker } from '@faker-js/faker'

export async function seed (knex: Knex): Promise<void> {
  await knex('Departments').del()

  const createDepartment = () => ({
    name: faker.company.name(),
    address: faker.location.streetAddress(),
    phone: faker.phone.number({ style: 'national' }),
    email: faker.internet.email(),
    chiefName: faker.person.fullName(),
    createdAt: new Date(),
    updatedAt: new Date()
  })
  const departments = Array.from({ length: 50 }).map(() => createDepartment())
  await knex('Departments').insert(departments)
};
