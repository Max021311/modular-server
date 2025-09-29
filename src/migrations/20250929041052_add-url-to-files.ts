import type { Knex } from 'knex'

export async function up (knex: Knex): Promise<void> {
  await knex.schema.alterTable('Files', table => {
    table.string('url').nullable()
  })
}

export async function down (knex: Knex): Promise<void> {
  await knex.schema.alterTable('Files', table => {
    table.dropColumn('url')
  })
}
