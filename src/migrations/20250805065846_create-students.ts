import type { Knex } from 'knex'
import configuration from '#src/common/configuration.js'

export async function up (knex: Knex): Promise<void> {
  await knex.schema
    .createTable('Students', function (table) {
      table.increments('id').primary().notNullable()
      table.string('name').index().notNullable()
      table.string('code').unique().index().notNullable()
      table.string('password').notNullable()
      table.integer('careerId').references('id').inTable('Careers').notNullable()
      table.timestamp('createdAt').notNullable().index()
      table.timestamp('updatedAt').notNullable()
      table.string('email').unique().notNullable()
      table.string('telephone').unique().notNullable()
    })
    // Add the generated tsvector column using raw SQL
  await knex.raw(`
    ALTER TABLE "Students" 
    ADD COLUMN search_vector tsvector 
    GENERATED ALWAYS AS (
      to_tsvector('${configuration.textSearch.language}', 
        COALESCE(name, '') || ' ' || 
        COALESCE(code, '') || ' ' || 
        COALESCE(email, '') || ' ' || 
        COALESCE(telephone, '')
      )
    ) STORED
  `)

  // Create the GIN index for fast searching
  await knex.raw(`
    CREATE INDEX idx_students_search ON "Students" USING GIN(search_vector)
  `)
}

export async function down (knex: Knex): Promise<void> {
  return knex.schema.dropTable('Students')
}
