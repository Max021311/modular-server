import { Knex } from 'knex'

export async function seed (knex: Knex): Promise<void> {
  await knex('Careers').del()

  await knex('Careers').insert([
    { // ID: 1
      name: 'Ing. informática',
      slug: 'INNI',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    { // ID: 2
      name: 'Ing. en computacion',
      slug: 'INCO',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ])
};
