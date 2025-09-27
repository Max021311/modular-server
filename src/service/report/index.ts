import type {
  ReportServiceI,
  FindAndCountParams,
  CreateReport,
  UpdateReport
} from './types.js'
import type { ModuleConstructorParams } from '#src/service/types.js'
import type { Knex } from 'knex'
import { Tables } from 'knex/types/tables.js'
import { PrefixedPick, AtLeastOneJoin } from '#src/types/utils.js'

type ConstructorParams = ModuleConstructorParams<
  'logger'|'connectionManager',
  never
>

type Report = Pick<Tables['Reports']['base'], 'id'|'studentId'|'vacancyId'|'cycleId'|'reportNumber'|'status'|'hours'|'fileId'|'createdAt'|'updatedAt'>
type CycleJoin = PrefixedPick<Tables['Cycles']['base'], 'id'|'slug'|'isCurrent'|'createdAt'|'updatedAt', 'cycle_'>
type StudentJoin = PrefixedPick<Tables['Students']['base'], 'id'|'name'|'code'|'careerId'|'email'|'telephone'|'createdAt'|'updatedAt', 'student_'>
type VacancyJoin = PrefixedPick<Tables['Vacancies']['base'], 'id'|'name'|'description'|'slots'|'cycleId'|'departmentId'|'disabled'|'createdAt'|'updatedAt', 'vacancy_'>

type ReportWithJoins = Report & AtLeastOneJoin<[CycleJoin, StudentJoin, VacancyJoin]>

export class ReportService implements ReportServiceI {
  private readonly logger: ConstructorParams['context']['logger']
  private readonly connectionManager: ConstructorParams['context']['connectionManager']

  constructor (params: ConstructorParams) {
    this.logger = params.context.logger
    this.connectionManager = params.context.connectionManager
  }

  private get db () {
    return this.connectionManager.getConnection()
  }

  private get selectQuery () {
    const db = this.db
    return db.table('Reports')
      .select<ReportWithJoins[]>(
        db.ref('id').withSchema('Reports'),
        db.ref('studentId').withSchema('Reports'),
        db.ref('vacancyId').withSchema('Reports'),
        db.ref('cycleId').withSchema('Reports'),
        db.ref('reportNumber').withSchema('Reports'),
        db.ref('status').withSchema('Reports'),
        db.ref('hours').withSchema('Reports'),
        db.ref('fileId').withSchema('Reports'),
        db.ref('createdAt').withSchema('Reports'),
        db.ref('updatedAt').withSchema('Reports')
      )
  }

  private applyCycleJoin <T extends Knex.QueryBuilder> (query: T, db: Knex) {
    return query.leftJoin('Cycles', 'Reports.cycleId', '=', 'Cycles.id')
      .select(
        db.ref('id').withSchema('Cycles').as('cycle_id'),
        db.ref('slug').withSchema('Cycles').as('cycle_slug'),
        db.ref('isCurrent').withSchema('Cycles').as('cycle_isCurrent'),
        db.ref('createdAt').withSchema('Cycles').as('cycle_createdAt'),
        db.ref('updatedAt').withSchema('Cycles').as('cycle_updatedAt')
      )
  }

  private applyStudentJoin <T extends Knex.QueryBuilder> (query: T, db: Knex) {
    return query.leftJoin('Students', 'Reports.studentId', '=', 'Students.id')
      .select(
        db.ref('id').withSchema('Students').as('student_id'),
        db.ref('name').withSchema('Students').as('student_name'),
        db.ref('code').withSchema('Students').as('student_code'),
        db.ref('careerId').withSchema('Students').as('student_careerId'),
        db.ref('email').withSchema('Students').as('student_email'),
        db.ref('telephone').withSchema('Students').as('student_telephone'),
        db.ref('createdAt').withSchema('Students').as('student_createdAt'),
        db.ref('updatedAt').withSchema('Students').as('student_updatedAt')
      )
  }

  private applyVacancyJoin <T extends Knex.QueryBuilder> (query: T, db: Knex) {
    return query.leftJoin('Vacancies', 'Reports.vacancyId', '=', 'Vacancies.id')
      .select(
        db.ref('id').withSchema('Vacancies').as('vacancy_id'),
        db.ref('name').withSchema('Vacancies').as('vacancy_name'),
        db.ref('description').withSchema('Vacancies').as('vacancy_description'),
        db.ref('slots').withSchema('Vacancies').as('vacancy_slots'),
        db.ref('cycleId').withSchema('Vacancies').as('vacancy_cycleId'),
        db.ref('departmentId').withSchema('Vacancies').as('vacancy_departmentId'),
        db.ref('disabled').withSchema('Vacancies').as('vacancy_disabled'),
        db.ref('createdAt').withSchema('Vacancies').as('vacancy_createdAt'),
        db.ref('updatedAt').withSchema('Vacancies').as('vacancy_updatedAt')
      )
  }

  async getById (id: number) {
    const result = await this.selectQuery.where('Reports.id', '=', id).first()

    if (!result) {
      return null
    }

    return {
      id: result.id,
      studentId: result.studentId,
      vacancyId: result.vacancyId,
      cycleId: result.cycleId,
      reportNumber: result.reportNumber,
      status: result.status,
      hours: result.hours,
      fileId: result.fileId,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt
    }
  }

  async findAndCount (params: FindAndCountParams) {
    const { limit, offset, order, status, reportNumber, studentId, vacancyId, cycleId, includeCycle, includeStudent, includeVacancy } = params
    const db = this.db
    let countQuery = db.table('Reports')
      .count({ count: '*' }).first()
    let selectQuery = this.selectQuery
      .limit(limit)
      .offset(offset)

    if (order) selectQuery = selectQuery.orderBy([{ column: order[0], order: order[1] }, { column: 'Reports.id', order: order[1] }])

    if (cycleId !== undefined) {
      selectQuery = selectQuery.where('Reports.cycleId', '=', cycleId)
      countQuery = countQuery.where('cycleId', '=', cycleId)
    }
    if (studentId !== undefined) {
      selectQuery = selectQuery.where('Reports.studentId', '=', studentId)
      countQuery = countQuery.where('studentId', '=', studentId)
    }
    if (vacancyId !== undefined) {
      selectQuery = selectQuery.where('Reports.vacancyId', '=', vacancyId)
      countQuery = countQuery.where('vacancyId', '=', vacancyId)
    }
    if (reportNumber !== undefined) {
      selectQuery = selectQuery.where('Reports.reportNumber', '=', reportNumber)
      countQuery = countQuery.where('reportNumber', '=', reportNumber)
    }
    if (status !== undefined) {
      selectQuery = selectQuery.where('Reports.status', '=', status)
      countQuery = countQuery.where('status', '=', status)
    }

    if (includeCycle === true) {
      selectQuery = selectQuery.modify(this.applyCycleJoin, db)
    }
    if (includeStudent === true) {
      selectQuery = selectQuery.modify(this.applyStudentJoin, db)
    }
    if (includeVacancy === true) {
      selectQuery = selectQuery.modify(this.applyVacancyJoin, db)
    }

    const [total, records] = await Promise.all([
      countQuery,
      selectQuery
    ])
    return {
      total: total?.count as number,
      records: records.map((result) => {
        const report = {
          id: result.id,
          studentId: result.studentId,
          vacancyId: result.vacancyId,
          cycleId: result.cycleId,
          reportNumber: result.reportNumber,
          status: result.status,
          hours: result.hours,
          fileId: result.fileId,
          createdAt: result.createdAt,
          updatedAt: result.updatedAt,
          cycle: 'cycle_id' in result
            ? {
                id: result.cycle_id,
                slug: result.cycle_slug,
                isCurrent: result.cycle_isCurrent,
                createdAt: result.cycle_createdAt,
                updatedAt: result.cycle_updatedAt
              }
            : undefined,
          student: 'student_id' in result
            ? {
                id: result.student_id,
                name: result.student_name,
                code: result.student_code,
                careerId: result.student_careerId,
                email: result.student_email,
                telephone: result.student_telephone,
                createdAt: result.student_createdAt,
                updatedAt: result.student_updatedAt
              }
            : undefined,
          vacancy: 'vacancy_id' in result
            ? {
                id: result.vacancy_id,
                name: result.vacancy_name,
                description: result.vacancy_description,
                slots: result.vacancy_slots,
                cycleId: result.vacancy_cycleId,
                departmentId: result.vacancy_departmentId,
                disabled: result.vacancy_disabled,
                createdAt: result.vacancy_createdAt,
                updatedAt: result.vacancy_updatedAt
              }
            : undefined
        }
        return report
      })
    }
  }

  async create (reportData: Omit<CreateReport, 'createdAt' | 'updatedAt'>) {
    const db = this.db
    const [result] = await db.table('Reports')
      .insert({
        ...reportData,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning([
        'id',
        'studentId',
        'vacancyId',
        'cycleId',
        'reportNumber',
        'status',
        'hours',
        'fileId',
        'createdAt',
        'updatedAt'
      ])
    this.logger.info(result, 'Report created')
    return result
  }

  async update (id: number, reportData: Omit<UpdateReport, 'updatedAt'>) {
    const db = this.db
    const [result] = await db.table('Reports')
      .where({ id })
      .update({
        ...reportData,
        updatedAt: new Date()
      })
      .returning([
        'id',
        'studentId',
        'vacancyId',
        'cycleId',
        'reportNumber',
        'status',
        'hours',
        'fileId',
        'createdAt',
        'updatedAt'
      ])
    this.logger.info(result, 'Report updated')
    return result
  }
}

