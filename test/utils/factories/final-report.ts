import { Factory } from 'fishery'
import { FinalReport, CreateFinalReport } from '#src/types/final-report.js'
import { faker } from '@faker-js/faker'
import connectionManager from '#src/common/bd/index.js'

class FinalReportFactory extends Factory<CreateFinalReport, null, FinalReport> {
}

export const finalReportFactory = FinalReportFactory.define(({ onCreate, params }) => {
  onCreate(async (finalReport) => {
    const result = await connectionManager.getConnection()
      .table('FinalReports')
      .insert(finalReport)
      .returning('*')
    return result[0]
  })

  return {
    studentId: params.studentId ?? 1,
    vacancyId: params.vacancyId ?? 1,
    cycleId: params.cycleId ?? 1,
    status: faker.helpers.arrayElement(['APPROVED', 'REJECTED', 'PENDING']),
    hours: faker.number.int({ min: 1, max: 500 }),
    fileId: params.fileId ?? 1,
    createdAt: new Date(),
    updatedAt: new Date()
  }
})