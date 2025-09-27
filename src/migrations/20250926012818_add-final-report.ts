import type { Knex } from 'knex'

export async function up (knex: Knex): Promise<void> {
  await knex.schema.createTable('FinalReports', (table) => {
    table.increments('id').primary()
    table.integer('studentId').references('id').inTable('Students').notNullable()
    table.integer('vacancyId').references('id').inTable('Vacancies').notNullable()
    table.integer('cycleId').references('id').inTable('Cycles').notNullable()
    table.enum('status', ['APPROVED', 'REJECTED', 'PENDING']).notNullable()
    table.integer('hours').notNullable()
    table.integer('fileId').references('id').inTable('Files').notNullable()
    table.timestamp('createdAt').notNullable()
    table.timestamp('updatedAt').notNullable()
    table.unique(['studentId', 'vacancyId', 'cycleId'])
  })
}

export async function down (knex: Knex): Promise<void> {
  await knex.schema.dropTable('FinalReports')
}
