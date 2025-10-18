import type { Knex } from 'knex'

export async function up (knex: Knex): Promise<void> {
  await knex.schema.alterTable('Vacancies', (db) => {
    db.integer('categoryId').references('id').inTable('Categories').nullable().defaultTo(null)
    db.enum('location', ['north', 'south', 'east', 'west', 'center'])
    db.enum('schedule', ['morning', 'afternoon', 'saturday'])
    db.enum('mode', ['presential', 'remote'])
  })
}

export async function down (knex: Knex): Promise<void> {
  await knex.schema.alterTable('Vacancies', (db) => {
    db.dropColumn('categoryId')
    db.dropColumn('location')
    db.dropColumn('schedule')
    db.dropColumn('mode')
  })
}
