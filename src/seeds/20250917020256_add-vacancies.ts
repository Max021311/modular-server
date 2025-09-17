import { Knex } from 'knex'
import { faker } from '@faker-js/faker'

export async function seed (knex: Knex): Promise<void> {
  await knex('Vacancies').del()

  await knex('Vacancies').insert([{
    name: 'Soporte técnico',
    description: '',
    slots: 10,
    cycleId: 5,
    departmentId: faker.number.int({ min: 1, max: 50 }),
    disabled: false,
    createdAt: new Date(),
    updatedAt: new Date()
  }, {
    name: 'Apoyo en via recreativa',
    description: '',
    slots: 10,
    cycleId: 5,
    departmentId: faker.number.int({ min: 1, max: 50 }),
    disabled: false,
    createdAt: new Date(),
    updatedAt: new Date()
  }])
};
