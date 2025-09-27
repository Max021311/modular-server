import { Factory } from 'fishery'
import { Report, CreateReport } from '#src/types/report.js'
import { faker } from '@faker-js/faker'
import connectionManager from '#src/common/bd/index.js'

class ReportFactory extends Factory<CreateReport, null, Report> {
}

export const reportFactory = ReportFactory.define(({ onCreate, params }) => {
  onCreate(async (report) => {
    const result = await connectionManager.getConnection()
      .table('Reports')
      .insert(report)
      .returning('*')
    return result[0]
  })

  return {
    studentId: params.studentId ?? 1,
    vacancyId: params.vacancyId ?? 1,
    cycleId: params.cycleId ?? 1,
    reportNumber: params.reportNumber ?? faker.helpers.arrayElement(['1', '2']),
    status: faker.helpers.arrayElement(['APPROVED', 'REJECTED', 'PENDING']),
    hours: faker.number.int({ min: 1, max: 500 }),
    fileId: params.fileId ?? 1,
    createdAt: new Date(),
    updatedAt: new Date()
  }
})