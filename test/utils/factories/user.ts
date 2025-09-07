import { Factory } from 'fishery'
import { User, CreateUser } from '#src/types/user'
import { faker } from '@faker-js/faker'
import connectionManager from '#src/common/bd'
import bcrypt from 'bcrypt'

class UserFactory extends Factory<CreateUser, null, User> {
}

export const userFactory = UserFactory.define(({ onCreate }) => {
  onCreate(async (user) => {
    const result = await connectionManager.getConnection()
      .table('Users')
      .insert({
        ...user,
        password: await bcrypt.hash(user.password, 13)
      })
      .returning('*')
    return result[0]
  })

  return {
    user: faker.internet.email(),
    name: faker.person.fullName(),
    password: faker.string.alphanumeric(10),
    permissions: [],
    createdAt: new Date(),
    updatedAt: new Date()
  }
})
