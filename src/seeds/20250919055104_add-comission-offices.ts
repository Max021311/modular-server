import { Knex } from 'knex'

export async function seed (knex: Knex): Promise<void> {
  await knex('ComissionOffices').del()

  // Inserts seed entries
  await knex('ComissionOffices').insert([
    {
      beginDate: new Date(),
      studentId: 1,
      vacancyId: 1,
      cycleId: 5,
      status: 'PENDING',
      fileId: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      beginDate: new Date(),
      studentId: 2,
      vacancyId: 1,
      cycleId: 5,
      status: 'PENDING',
      fileId: 2,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      beginDate: new Date(),
      studentId: 3,
      vacancyId: 2,
      cycleId: 5,
      status: 'PENDING',
      fileId: 3,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      beginDate: new Date(),
      studentId: 4,
      vacancyId: 2,
      cycleId: 5,
      status: 'PENDING',
      fileId: 4,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ])
};
