import { Factory } from 'fishery'
import { Department, CreateDepartment } from '#src/types/departments'
import { faker } from '@faker-js/faker'
import connectionManager from '#src/common/bd'

class DepartmentFactory extends Factory<CreateDepartment, null, Department> {
}

export const departmentFactory = DepartmentFactory.define(({ onCreate }) => {
  onCreate(async (department) => {
    const result = await connectionManager.getConnection()
      .table('Departments')
      .insert(department)
      .returning('*')
    return result[0]
  })

  return {
    name: 'Secretaria de transporte',
    address: faker.location.streetAddress(),
    phone: faker.phone.number(),
    email: faker.internet.email(),
    chiefName: faker.person.fullName(),
    createdAt: new Date(),
    updatedAt: new Date()
  }
})
