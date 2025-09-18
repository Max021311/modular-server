import type {
  VacancyServiceI,
  FindAndCountParams,
  FindByIdOpts,
  VacancyServiceConfigI,
  CreateVacancy
} from './types.js'
import type { ModuleConstructorParams } from '#src/service/types.js'
import type { Knex } from 'knex'
import { Tables } from 'knex/types/tables.js'
import { PrefixedPick, AtLeastOneJoin } from '#src/types/utils.js'

type ConstructorParams = ModuleConstructorParams<
  'logger'|'connectionManager',
  never,
  VacancyServiceConfigI
>

type Vacancy = Pick<Tables['Vacancies']['base'], 'id'|'name'|'description'|'slots'|'cycleId'|'departmentId'|'disabled'|'createdAt'|'updatedAt'>
type CycleJoin = PrefixedPick<Tables['Cycles']['base'], 'id'|'slug'|'isCurrent'|'createdAt'|'updatedAt', 'cycle_'>
type DepartmentJoin = PrefixedPick<Tables['Departments']['base'], 'id'|'name'|'address'|'phone'|'email'|'chiefName'|'createdAt'|'updatedAt', 'department_'>

type VacancyWithJoins = Vacancy & AtLeastOneJoin<[CycleJoin, DepartmentJoin]>

export class VacancyService implements VacancyServiceI {
  private readonly logger: ConstructorParams['context']['logger']
  private readonly connectionManager: ConstructorParams['context']['connectionManager']
  private readonly config: ConstructorParams['config']

  constructor (params: ConstructorParams) {
    this.logger = params.context.logger
    this.connectionManager = params.context.connectionManager
    this.config = params.config
  }

  private get db () {
    return this.connectionManager.getConnection()
  }

  private get selectQuery () {
    const db = this.db
    return db.table('Vacancies')
      .select<VacancyWithJoins[]>(
        db.ref('id').withSchema('Vacancies'),
        db.ref('name').withSchema('Vacancies'),
        db.ref('description').withSchema('Vacancies'),
        db.ref('slots').withSchema('Vacancies'),
        db.ref('cycleId').withSchema('Vacancies'),
        db.ref('departmentId').withSchema('Vacancies'),
        db.ref('disabled').withSchema('Vacancies'),
        db.ref('createdAt').withSchema('Vacancies'),
        db.ref('updatedAt').withSchema('Vacancies')
      )
  }

  private applyDepartmentJoin <T extends Knex.QueryBuilder> (query: T, db: Knex) {
    return query.leftJoin('Departments', 'Vacancies.departmentId', '=', 'Departments.id')
      .select(
        db.ref('id').withSchema('Departments').as('department_id'),
        db.ref('name').withSchema('Departments').as('department_name'),
        db.ref('address').withSchema('Departments').as('department_address'),
        db.ref('phone').withSchema('Departments').as('department_phone'),
        db.ref('email').withSchema('Departments').as('department_email'),
        db.ref('chiefName').withSchema('Departments').as('department_chiefName'),
        db.ref('createdAt').withSchema('Departments').as('department_createdAt'),
        db.ref('updatedAt').withSchema('Departments').as('department_updatedAt')
      )
  }

  private applyCycleJoin <T extends Knex.QueryBuilder> (query: T, db: Knex) {
    return query.leftJoin('Cycles', 'Vacancies.cycleId', '=', 'Cycles.id')
      .select(
        db.ref('id').withSchema('Cycles').as('cycle_id'),
        db.ref('slug').withSchema('Cycles').as('cycle_slug'),
        db.ref('isCurrent').withSchema('Cycles').as('cycle_isCurrent'),
        db.ref('createdAt').withSchema('Cycles').as('cycle_createdAt'),
        db.ref('updatedAt').withSchema('Cycles').as('cycle_updatedAt')
      )
  }

  async findAndCount (params: FindAndCountParams) {
    const { limit, offset, order, search, includeCycle, includeDepartment, departmentId, cycleId } = params
    const db = this.db

    let countQuery = db.table('Vacancies')
      .count({ count: '*' }).first()
    const baseSelectQuery = this.selectQuery
      .limit(limit)
      .offset(offset)

    let selectQuery = baseSelectQuery

    if (order) selectQuery = selectQuery.orderBy([{ column: order[0], order: order[1] }, { column: 'Vacancies.id', order: order[1] }])

    if (search) {
      const { language } = this.config.textSearch
      selectQuery = selectQuery
        .where(db.raw('search_vector @@ plainto_tsquery(?, ?)', [language, search]))
      countQuery = countQuery
        .where(db.raw('search_vector @@ plainto_tsquery(?, ?)', [language, search]))
    }

    if (departmentId) {
      selectQuery = selectQuery.where('Vacancies.departmentId', '=', departmentId)
      countQuery = countQuery.where('departmentId', '=', departmentId)
    }

    if (cycleId) {
      selectQuery = selectQuery.where('Vacancies.cycleId', '=', cycleId)
      countQuery = countQuery.where('cycleId', '=', cycleId)
    }

    if (includeCycle === true) {
      selectQuery = selectQuery.modify(this.applyCycleJoin, db)
    }
    if (includeDepartment === true) {
      selectQuery = selectQuery.modify(this.applyDepartmentJoin, db)
    }

    const [total, records] = await Promise.all([
      countQuery,
      selectQuery
    ])

    return {
      total: total?.count as number,
      records: records.map((result) => {
        const vacancy = {
          id: result.id,
          name: result.name,
          description: result.description,
          slots: result.slots,
          cycleId: result.cycleId,
          departmentId: result.departmentId,
          disabled: result.disabled,
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
          department: 'department_id' in result
            ? {
                id: result.department_id,
                name: result.department_name,
                address: result.department_address,
                phone: result.department_phone,
                email: result.department_email,
                chiefName: result.department_chiefName,
                createdAt: result.department_createdAt,
                updatedAt: result.department_updatedAt
              }
            : undefined
        }
        return vacancy
      })
    }
  }

  async findById (id: number, opts?: FindByIdOpts) {
    const db = this.db
    let query = this.selectQuery
      .where('Vacancies.id', '=', id)
      .first()

    if (opts?.includeCycle) query = query.modify(this.applyCycleJoin, db)
    if (opts?.includeDepartment) query = query.modify(this.applyDepartmentJoin, db)

    const result = await query

    if (!result) {
      return null
    }

    const vacancy = {
      id: result.id,
      name: result.name,
      description: result.description,
      slots: result.slots,
      cycleId: result.cycleId,
      departmentId: result.departmentId,
      disabled: result.disabled,
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
      department: 'department_id' in result
        ? {
            id: result.department_id,
            name: result.department_name,
            address: result.department_address,
            phone: result.department_phone,
            email: result.department_email,
            chiefName: result.department_chiefName,
            createdAt: result.department_createdAt,
            updatedAt: result.department_updatedAt
          }
        : undefined
    }

    return vacancy
  }

  async create (vacancy: Omit<CreateVacancy, 'createdAt'|'updatedAt'>) {
    const db = this.db

    const [result] = await db.table('Vacancies')
      .insert({
        ...vacancy,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning('*')

    const createdVacancy = {
      id: result.id,
      name: result.name,
      description: result.description,
      slots: result.slots,
      cycleId: result.cycleId,
      departmentId: result.departmentId,
      disabled: result.disabled,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt
    }

    return createdVacancy
  }
}
