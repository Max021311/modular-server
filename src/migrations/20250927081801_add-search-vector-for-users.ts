import type { Knex } from 'knex'
import configuration from '#src/common/configuration.js'
export async function up (knex: Knex): Promise<void> {
  const language = configuration.textSearch.language
  await knex.raw(`
    ALTER TABLE "Users" 
    ADD COLUMN search_vector tsvector 
    GENERATED ALWAYS AS (
      to_tsvector('${language}', 
        COALESCE("Users".name, '') || ' ' ||
        COALESCE("Users".user, '')
      )
    ) STORED
    `)
  await knex.raw(`
    CREATE INDEX idx_users_search ON "Users" USING GIN(search_vector)
  `)
}

export async function down (knex: Knex): Promise<void> {
  await knex.schema.alterTable('Users', (table) => {
    table.dropColumn('search_vector')
    table.dropIndex('idx_users_search')
  })
}
