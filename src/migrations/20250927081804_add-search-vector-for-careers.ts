import type { Knex } from 'knex'
import configuration from '#src/common/configuration.js'

export async function up (knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE "Careers" 
    ADD COLUMN search_vector tsvector 
    GENERATED ALWAYS AS (
      to_tsvector('${configuration.textSearch.language}', 
        COALESCE(name, '') || ' ' ||
        COALESCE(slug, '')
      )
    ) STORED
  `)
  await knex.raw(`
    CREATE INDEX idx_careers_search ON "Careers" USING GIN(search_vector)
  `)
}

export async function down (knex: Knex): Promise<void> {
  await knex.schema.alterTable('Careers', (table) => {
    table.dropColumn('search_vector')
    table.dropIndex('idx_careers_search')
  })
}
