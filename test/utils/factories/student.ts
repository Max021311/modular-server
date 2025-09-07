import { Factory } from 'fishery'
import { Student, CreateStudent } from '#src/types/student'
import { faker } from '@faker-js/faker'
import connectionManager from '#src/common/bd'
import bcrypt from 'bcrypt'

class StudentFactory extends Factory<CreateStudent, null, Student> {
}

export const studentFactory = StudentFactory.define(({ onCreate }) => {
  onCreate(async (student) => {
    const result = await connectionManager.getConnection()
      .table('Students')
      .insert({
        ...student,
        password: await bcrypt.hash(student.password, 13)
      })
      .returning('*')
    return result[0]
  })

  return {
    name: faker.person.fullName(),
    code: faker.string.alphanumeric(8).toUpperCase(),
    password: faker.string.alphanumeric(10),
    careerId: faker.number.int({ min: 1, max: 10 }),
    email: faker.internet.email(),
    telephone: faker.phone.number(),
    createdAt: new Date(),
    updatedAt: new Date()
  }
})
