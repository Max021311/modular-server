import type { Knex } from 'knex'

export async function up (knex: Knex): Promise<void> {
  await knex.schema.createTable('Cycles', (table) => {
    table.increments('id').primary()
    table.string('slug').notNullable().unique()
    table.boolean('isCurrent').defaultTo(false)
    table.timestamp('createdAt').defaultTo(knex.fn.now())
    table.timestamp('updatedAt').defaultTo(knex.fn.now())
    table.index('slug')
  })

  // Ensure only one record can have isCurrent = true
  await knex.raw('CREATE UNIQUE INDEX cycles_is_current_unique ON "Cycles" ("isCurrent") WHERE "isCurrent" = true')
}

export async function down (knex: Knex): Promise<void> {
  await knex.schema.dropTable('Cycles')
}
