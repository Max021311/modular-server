import { Factory } from 'fishery'
import { Career, CreateCareer } from '#src/types/career'
import { faker } from '@faker-js/faker'
import connectionManager from '#src/common/bd'

class CareerFactory extends Factory<CreateCareer, null, Career> {
}

export const careerFactory = CareerFactory.define(({ onCreate }) => {
  onCreate(async (career) => {
    const result = await connectionManager.getConnection()
      .table('Careers')
      .insert(career)
      .returning('*')
    return result[0]
  })

  const name = faker.person.jobTitle()
  return {
    name,
    slug: name.toLowerCase().replace(/\s+/g, '-'),
    createdAt: new Date(),
    updatedAt: new Date()
  }
})