import { Knex } from 'knex'

export async function seed (knex: Knex): Promise<void> {
  await knex('Reports').del()

  // Inserts seed entries
  await knex('Reports').insert([
    {
      studentId: 1,
      vacancyId: 1,
      cycleId: 5,
      status: 'PENDING',
      hours: 360,
      fileId: 1,
      reportNumber: '1',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      studentId: 1,
      vacancyId: 1,
      cycleId: 5,
      status: 'PENDING',
      hours: 360,
      fileId: 1,
      reportNumber: '2',
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
      reportNumber: '1',
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
      reportNumber: '2',
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
      reportNumber: '1',
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
      reportNumber: '2',
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
      reportNumber: '1',
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
      reportNumber: '2',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ])
};
