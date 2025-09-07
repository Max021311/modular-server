import type { Knex } from 'knex'

export async function up (knex: Knex): Promise<void> {
  return knex.schema
    .createTable('Careers', function (table) {
      table.increments('id').primary().notNullable()
      table.string('name').unique().notNullable()
      table.string('slug').unique().notNullable()
      table.timestamp('createdAt').notNullable()
      table.timestamp('updatedAt').notNullable()
    })
}

export async function down (knex: Knex): Promise<void> {
  return knex.schema.dropTable('Careers')
}
