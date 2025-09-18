import type { Knex } from 'knex'

export async function up (knex: Knex): Promise<void> {
  await knex.schema.createTable('VacanciesToStudents', (table) => {
    table.increments('id').primary()
    table.integer('vacancyId').notNullable().references('id').inTable('Vacancies')
    table.integer('studentId').notNullable().references('id').inTable('Students')
    table.timestamp('createdAt').notNullable()
    table.timestamp('updatedAt').notNullable()

    table.unique(['vacancyId', 'studentId'])

    table.index('vacancyId')
    table.index('studentId')
  })
}

export async function down (knex: Knex): Promise<void> {
  await knex.schema.dropTable('VacanciesToStudents')
}
