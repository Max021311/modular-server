import type { Knex } from 'knex'

export async function up (knex: Knex): Promise<void> {
  return knex.schema
    .createTable('Students', function (table) {
      table.increments('id').primary().notNullable()
      table.string('name').index().notNullable()
      table.string('code').unique().index().notNullable()
      table.string('password').notNullable()
      table.integer('careerId').references('id').inTable('Careers').notNullable()
      table.date('createdAt').notNullable()
      table.string('email').unique().notNullable()
      table.string('telephone').unique().notNullable()
      table.timestamp('updatedAt').notNullable()
    })
}

export async function down (knex: Knex): Promise<void> {
  return knex.schema.dropTable('Students')
}
