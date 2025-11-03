import type { Knex } from 'knex'
import configuration from '#src/common/configuration.js'

export async function up (knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE "Categories" 
    ADD COLUMN search_vector tsvector 
    GENERATED ALWAYS AS (
      to_tsvector('${configuration.textSearch.language}', 
        COALESCE(name, '')
      )
    ) STORED
  `)
  await knex.raw(`
    CREATE INDEX idx_categories_search ON "Categories" USING GIN(search_vector)
  `)
}

export async function down (knex: Knex): Promise<void> {
  await knex.schema.alterTable('Categories', (table) => {
    table.dropColumn('search_vector')
    table.dropIndex('idx_categories_search')
  })
}
