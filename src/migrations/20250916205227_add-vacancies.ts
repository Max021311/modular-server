import type { Knex } from 'knex'
import configuration from '#src/common/configuration'

export async function up (knex: Knex): Promise<void> {
  await knex.schema.createTable('Vacancies', (table) => {
    table.increments('id').primary()
    table.text('name')
    table.text('description')
    table.integer('slots')
    table.integer('cycleId').references('id').inTable('Cycles')
    table.integer('departmentId').references('id').inTable('Departments')
    table.boolean('disabled')
    table.timestamp('createdAt').defaultTo(knex.fn.now())
    table.timestamp('updatedAt').defaultTo(knex.fn.now())
  })
  await knex.raw(`
    ALTER TABLE "Vacancies" 
    ADD COLUMN search_vector tsvector 
    GENERATED ALWAYS AS (
      to_tsvector('${configuration.textSearch.language}', 
        COALESCE(name, '') || ' ' || 
        COALESCE(description, '')
      )
    ) STORED
  `)
}

export async function down (knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('Vacancies')
}
