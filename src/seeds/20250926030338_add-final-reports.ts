import { Knex } from 'knex'

export async function seed (knex: Knex): Promise<void> {
  await knex('FinalReports').del()

  // Inserts seed entries
  await knex('FinalReports').insert([
    {
      studentId: 1,
      vacancyId: 1,
      cycleId: 5,
      status: 'PENDING',
      hours: 360,
      fileId: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      studentId: 2,
      vacancyId: 1,
      cycleId: 5,
      status: 'PENDING',
      hours: 360,
      fileId: 2,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      studentId: 3,
      vacancyId: 2,
      cycleId: 5,
      status: 'PENDING',
      hours: 360,
      fileId: 3,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      studentId: 4,
      vacancyId: 2,
      cycleId: 5,
      status: 'PENDING',
      hours: 360,
      fileId: 4,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ])
};
