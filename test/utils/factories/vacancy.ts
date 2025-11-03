import { Factory } from 'fishery'
import { Vacancy, CreateVacancy } from '#src/types/vacancy.js'
import { faker } from '@faker-js/faker'
import connectionManager from '#src/common/bd/index.js'

class VacancyFactory extends Factory<CreateVacancy, null, Vacancy> {
}

export const vacancyFactory = VacancyFactory.define(({ onCreate, params }) => {
  onCreate(async (vacancy) => {
    const result = await connectionManager.getConnection()
      .table('Vacancies')
      .insert(vacancy)
      .returning('*')
    return result[0]
  })

  return {
    name: faker.helpers.arrayElement(['IT Support', 'Administrative Assistant', 'Marketing Intern', 'Data Analyst']),
    description: faker.lorem.paragraph(),
    slots: faker.number.int({ min: 1, max: 10 }),
    cycleId: params.cycleId ?? 1,
    departmentId: params.departmentId ?? 1,
    categoryId: params.categoryId ?? null,
    location: faker.helpers.arrayElement(['north', 'south', 'east', 'west', 'center'] as const),
    schedule: faker.helpers.arrayElement(['morning', 'afternoon', 'saturday'] as const),
    mode: faker.helpers.arrayElement(['presential', 'remote'] as const),
    disabled: false,
    createdAt: new Date(),
    updatedAt: new Date()
  }
})
