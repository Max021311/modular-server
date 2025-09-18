import { Knex } from 'knex'

export async function seed (knex: Knex): Promise<void> {
  await knex('Cycles').del()

  await knex('Cycles').insert([
    { slug: '2023A', isCurrent: false, createdAt: new Date(), updatedAt: new Date() }, // ID: 1
    { slug: '2023B', isCurrent: false, createdAt: new Date(), updatedAt: new Date() }, // ID: 2
    { slug: '2024A', isCurrent: false, createdAt: new Date(), updatedAt: new Date() }, // ID: 3
    { slug: '2024B', isCurrent: false, createdAt: new Date(), updatedAt: new Date() }, // ID: 4
    { slug: '2025A', isCurrent: true, createdAt: new Date(), updatedAt: new Date() } // ID: 5
  ])
};
