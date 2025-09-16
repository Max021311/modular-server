import { Knex } from 'knex'

export async function seed (knex: Knex): Promise<void> {
  await knex('Cycles').del()

  await knex('Cycles').insert([
    { slug: '2023A', isCurrent: false },
    { slug: '2023B', isCurrent: false },
    { slug: '2024A', isCurrent: false },
    { slug: '2024B', isCurrent: false },
    { slug: '2025A', isCurrent: true }
  ])
};
