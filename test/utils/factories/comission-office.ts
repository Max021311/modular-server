import { Factory } from 'fishery'
import { ComissionOffice, CreateComissionOffice } from '#src/types/comission-office.js'
import { faker } from '@faker-js/faker'
import connectionManager from '#src/common/bd/index.js'

class ComissionOfficeFactory extends Factory<CreateComissionOffice, null, ComissionOffice> {
}

export const comissionOfficeFactory = ComissionOfficeFactory.define(({ onCreate, params }) => {
  onCreate(async (comissionOffice) => {
    const result = await connectionManager.getConnection()
      .table('ComissionOffices')
      .insert(comissionOffice)
      .returning('*')
    return result[0]
  })

  return {
    studentId: params.studentId ?? 1,
    vacancyId: params.vacancyId ?? 1,
    cycleId: params.cycleId ?? 1,
    beginDate: faker.date.future(),
    status: faker.helpers.arrayElement(['APPROVED', 'REJECTED', 'PENDING']),
    fileId: params.fileId ?? 1,
    createdAt: new Date(),
    updatedAt: new Date()
  }
})
