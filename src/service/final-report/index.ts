import type {
  FinalReportServiceI,
  FindAndCountParams,
  CreateFinalReport,
  UpdateFinalReport,
  GetByIdParams
} from './types.js'
import type { ModuleConstructorParams } from '#src/service/types.js'
import type { Knex } from 'knex'
import { Tables } from 'knex/types/tables.js'
import { PrefixedPick, AtLeastOneJoin } from '#src/types/utils.js'

type ConstructorParams = ModuleConstructorParams<
  'logger'|'connectionManager',
  never
>

type FinalReport = Pick<Tables['FinalReports']['base'], 'id'|'studentId'|'vacancyId'|'cycleId'|'status'|'hours'|'fileId'|'createdAt'|'updatedAt'>
type CycleJoin = PrefixedPick<Tables['Cycles']['base'], 'id'|'slug'|'isCurrent'|'createdAt'|'updatedAt', 'cycle_'>
type StudentJoin = PrefixedPick<Tables['Students']['base'], 'id'|'name'|'code'|'careerId'|'email'|'telephone'|'createdAt'|'updatedAt', 'student_'>
type VacancyJoin = PrefixedPick<Tables['Vacancies']['base'], 'id'|'name'|'description'|'slots'|'cycleId'|'departmentId'|'disabled'|'createdAt'|'updatedAt', 'vacancy_'>

type FinalReportWithJoins = FinalReport & AtLeastOneJoin<[CycleJoin, StudentJoin, VacancyJoin]>

export class FinalReportService implements FinalReportServiceI {
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
    return db.table('FinalReports')
      .select<FinalReportWithJoins[]>(
        db.ref('id').withSchema('FinalReports'),
        db.ref('studentId').withSchema('FinalReports'),
        db.ref('vacancyId').withSchema('FinalReports'),
        db.ref('cycleId').withSchema('FinalReports'),
        db.ref('status').withSchema('FinalReports'),
        db.ref('hours').withSchema('FinalReports'),
        db.ref('fileId').withSchema('FinalReports'),
        db.ref('createdAt').withSchema('FinalReports'),
        db.ref('updatedAt').withSchema('FinalReports')
      )
  }

  private applyCycleJoin <T extends Knex.QueryBuilder> (query: T, db: Knex) {
    return query.leftJoin('Cycles', 'FinalReports.cycleId', '=', 'Cycles.id')
      .select(
        db.ref('id').withSchema('Cycles').as('cycle_id'),
        db.ref('slug').withSchema('Cycles').as('cycle_slug'),
        db.ref('isCurrent').withSchema('Cycles').as('cycle_isCurrent'),
        db.ref('createdAt').withSchema('Cycles').as('cycle_createdAt'),
        db.ref('updatedAt').withSchema('Cycles').as('cycle_updatedAt')
      )
  }

  private applyStudentJoin <T extends Knex.QueryBuilder> (query: T, db: Knex) {
    return query.leftJoin('Students', 'FinalReports.studentId', '=', 'Students.id')
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
    return query.leftJoin('Vacancies', 'FinalReports.vacancyId', '=', 'Vacancies.id')
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

  async getById (id: number, params?: GetByIdParams) {
    const { includeCycle, includeStudent, includeVacancy } = params || {}
    const db = this.db
    let selectQuery = this.selectQuery.where('FinalReports.id', '=', id)

    if (includeCycle === true) {
      selectQuery = selectQuery.modify(this.applyCycleJoin, db)
    }
    if (includeStudent === true) {
      selectQuery = selectQuery.modify(this.applyStudentJoin, db)
    }
    if (includeVacancy === true) {
      selectQuery = selectQuery.modify(this.applyVacancyJoin, db)
    }

    const result = await selectQuery.first()

    if (!result) {
      return null
    }

    const finalReport = {
      id: result.id,
      studentId: result.studentId,
      vacancyId: result.vacancyId,
      cycleId: result.cycleId,
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

    return finalReport
  }

  async findAndCount (params: FindAndCountParams) {
    const { limit, offset, order, status, studentId, vacancyId, cycleId, includeCycle, includeStudent, includeVacancy } = params
    const db = this.db
    let countQuery = db.table('FinalReports')
      .count({ count: '*' }).first()
    let selectQuery = this.selectQuery
      .limit(limit)
      .offset(offset)

    if (order) selectQuery = selectQuery.orderBy([{ column: order[0], order: order[1] }, { column: 'FinalReports.id', order: order[1] }])

    if (cycleId !== undefined) {
      selectQuery = selectQuery.where('FinalReports.cycleId', '=', cycleId)
      countQuery = countQuery.where('cycleId', '=', cycleId)
    }
    if (studentId !== undefined) {
      selectQuery = selectQuery.where('FinalReports.studentId', '=', studentId)
      countQuery = countQuery.where('studentId', '=', studentId)
    }
    if (vacancyId !== undefined) {
      selectQuery = selectQuery.where('FinalReports.vacancyId', '=', vacancyId)
      countQuery = countQuery.where('vacancyId', '=', vacancyId)
    }
    if (status !== undefined) {
      selectQuery = selectQuery.where('FinalReports.status', '=', status)
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
        const finalReport = {
          id: result.id,
          studentId: result.studentId,
          vacancyId: result.vacancyId,
          cycleId: result.cycleId,
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
        return finalReport
      })
    }
  }

  async create (finalReportData: Omit<CreateFinalReport, 'createdAt' | 'updatedAt'>) {
    const db = this.db
    const [result] = await db.table('FinalReports')
      .insert({
        ...finalReportData,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning([
        'id',
        'studentId',
        'vacancyId',
        'cycleId',
        'status',
        'hours',
        'fileId',
        'createdAt',
        'updatedAt'
      ])
    this.logger.info(result, 'FinalReport created')
    return result
  }

  async update (id: number, finalReportData: Omit<UpdateFinalReport, 'updatedAt'>) {
    const db = this.db
    const [result] = await db.table('FinalReports')
      .where({ id })
      .update({
        ...finalReportData,
        updatedAt: new Date()
      })
      .returning([
        'id',
        'studentId',
        'vacancyId',
        'cycleId',
        'status',
        'hours',
        'fileId',
        'createdAt',
        'updatedAt'
      ])
    this.logger.info(result, 'FinalReport updated')
    return result
  }

  async delete (id: number) {
    const db = this.db
    await db.table('FinalReports')
      .where({ id })
      .del()
    this.logger.info({ id }, 'Final report deleted')
  }
}
