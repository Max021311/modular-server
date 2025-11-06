import type { Knex } from 'knex'

export async function up (knex: Knex): Promise<void> {
  await knex.schema.alterTable('Vacancies', (table) => {
    table.boolean('disabled').notNullable().defaultTo(false).alter()
  })
}

export async function down (knex: Knex): Promise<void> {
  await knex.schema.alterTable('Vacancies', (table) => {
    table.boolean('disabled').nullable().alter()
  })
}
