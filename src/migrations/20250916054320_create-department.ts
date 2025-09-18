import type { Knex } from 'knex'
import configuration from '#src/common/configuration.js'

export async function up (knex: Knex): Promise<void> {
  await knex.schema
    .createTable('Departments', function (table) {
      table.increments('id').primary().notNullable()
      table.string('name').notNullable()
      table.string('address').notNullable()
      table.string('phone').unique().notNullable()
      table.string('email').unique().notNullable()
      table.string('chiefName').notNullable()
      table.timestamp('createdAt').notNullable().index()
      table.timestamp('updatedAt').notNullable()
    })
  await knex.raw(`
    ALTER TABLE "Departments" 
    ADD COLUMN search_vector tsvector 
    GENERATED ALWAYS AS (
      to_tsvector('${configuration.textSearch.language}', 
        COALESCE(name, '') || ' ' || 
        COALESCE(phone, '') || ' ' || 
        COALESCE(email, '') || ' ' || 
        COALESCE("chiefName", '')
      )
    ) STORED
  `)

  await knex.raw(`
    CREATE INDEX idx_departments_search ON "Departments" USING GIN(search_vector)
  `)
}

export async function down (knex: Knex): Promise<void> {
  return knex.schema
    .dropTable('Departments')
}
