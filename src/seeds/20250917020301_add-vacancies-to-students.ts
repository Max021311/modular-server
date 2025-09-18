import { Knex } from 'knex'

export async function seed (knex: Knex): Promise<void> {
  await knex('VacanciesToStudents').del()

  // Inserts seed entries
  await knex('VacanciesToStudents').insert([
    {
      studentId: 1,
      vacancyId: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      studentId: 2,
      vacancyId: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      studentId: 3,
      vacancyId: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      studentId: 4,
      vacancyId: 2,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      studentId: 5,
      vacancyId: 2,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      studentId: 6,
      vacancyId: 2,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ])
};
