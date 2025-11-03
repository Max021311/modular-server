import { Knex } from 'knex'

export async function seed (knex: Knex): Promise<void> {
  await knex('Categories').del()

  await knex('Categories').insert([{
    name: 'Prueba'
  }, {
    name: 'Tecnología'
  }])
};
