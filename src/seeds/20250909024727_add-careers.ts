import { Knex } from 'knex'

export async function seed (knex: Knex): Promise<void> {
  await knex('Careers').del()

  await knex('Careers').insert([
    { // ID: 1
      name: 'Ing. Informática',
      slug: 'INNI',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    { // ID: 2
      name: 'Ing. en Computacion',
      slug: 'INCO',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    { // ID: 3
      name: 'Ing. Industrial',
      slug: 'IND',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    { // ID: 4
      name: 'Ing. Química',
      slug: 'IQ',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ])
};
