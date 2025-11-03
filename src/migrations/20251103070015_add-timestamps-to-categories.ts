import type { Knex } from 'knex'

export async function up (knex: Knex): Promise<void> {
  await knex.schema.alterTable('Categories', (table) => {
    table.timestamp('createdAt').defaultTo(knex.fn.now())
    table.timestamp('updatedAt').defaultTo(knex.fn.now())
  })
}

export async function down (knex: Knex): Promise<void> {
  await knex.schema.alterTable('Categories', (table) => {
    table.dropColumn('createdAt')
    table.dropColumn('updatedAt')
  })
}
