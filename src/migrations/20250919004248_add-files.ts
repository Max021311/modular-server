import type { Knex } from 'knex'

export async function up (knex: Knex): Promise<void> {
  await knex.schema.createTable('Files', (db) => {
    db.increments('id').primary()
    db.string('name').notNullable()
    db.timestamp('createdAt').notNullable()
    db.timestamp('updatedAt').notNullable()
  })
}

export async function down (knex: Knex): Promise<void> {
  await knex.schema.dropTable('Files')
}
