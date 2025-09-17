import { Factory } from 'fishery'
import { faker } from '@faker-js/faker'
import connectionManager from '#src/common/bd'

interface VacancyToStudent {
  id: number
  vacancyId: number
  studentId: number
  createdAt: Date
  updatedAt: Date
}

interface CreateVacancyToStudent {
  vacancyId: number
  studentId: number
  createdAt: Date
  updatedAt: Date
}

class VacancyToStudentFactory extends Factory<CreateVacancyToStudent, null, VacancyToStudent> {
}

export const vacancyToStudentFactory = VacancyToStudentFactory.define(({ onCreate }) => {
  onCreate(async (vacancyToStudent) => {
    const result = await connectionManager.getConnection()
      .table('VacanciesToStudents')
      .insert(vacancyToStudent)
      .returning('*')
    return result[0]
  })

  return {
    vacancyId: faker.number.int({ min: 1, max: 1000 }),
    studentId: faker.number.int({ min: 1, max: 1000 }),
    createdAt: new Date(),
    updatedAt: new Date()
  }
})