import type {
  DepartmentServiceI,
  FindAndCountParams,
  DepartmentServiceConfigI,
  CreateDepartment,
  UpdateDepartment
} from './types'
import type { ModuleConstructorParams } from '#src/service/types'

type ConstructorParams = ModuleConstructorParams<
  'logger'|'connectionManager',
  never,
  DepartmentServiceConfigI
>

export class DepartmentService implements DepartmentServiceI {
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
    return db.table('Departments')
      .select(
        db.ref('id').withSchema('Departments'),
        db.ref('name').withSchema('Departments'),
        db.ref('address').withSchema('Departments'),
        db.ref('phone').withSchema('Departments'),
        db.ref('email').withSchema('Departments'),
        db.ref('chiefName').withSchema('Departments'),
        db.ref('createdAt').withSchema('Departments'),
        db.ref('updatedAt').withSchema('Departments')
      )
  }

  async findById (id: number) {
    const result = await this.selectQuery.where('Departments.id', '=', id).first()

    if (!result) {
      return null
    }

    return {
      id: result.id,
      name: result.name,
      address: result.address,
      phone: result.phone,
      email: result.email,
      chiefName: result.chiefName,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt
    }
  }

  async findAndCountAll (params: FindAndCountParams) {
    const { limit, offset, order, search } = params
    const db = this.db
    let countQuery = db.table('Departments')
      .count({ count: '*' }).first()
    let selectQuery = this.selectQuery
      .limit(limit)
      .offset(offset)

    if (order) selectQuery = selectQuery.orderBy([{ column: order[0], order: order[1] }, { column: 'Departments.id', order: order[1] }])

    if (search) {
      const { language } = this.config.textSearch
      selectQuery = selectQuery
        .whereRaw('search_vector @@ plainto_tsquery(?, ?)', [language, search])
      countQuery = countQuery
        .whereRaw('search_vector @@ plainto_tsquery(?, ?)', [language, search])
    }

    const [total, records] = await Promise.all([
      countQuery,
      selectQuery
    ])
    return {
      total: total?.count as number,
      records: records.map((result) => {
        return {
          id: result.id,
          name: result.name,
          address: result.address,
          phone: result.phone,
          email: result.email,
          chiefName: result.chiefName,
          createdAt: result.createdAt,
          updatedAt: result.updatedAt
        }
      })
    }
  }

  async create (departmentData: Omit<CreateDepartment, 'createdAt' | 'updatedAt'>) {
    const db = this.db
    const [result] = await db.table('Departments')
      .insert({
        ...departmentData,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning([
        'id',
        'name',
        'address',
        'phone',
        'email',
        'chiefName',
        'createdAt',
        'updatedAt'
      ])
    this.logger.info(result, 'Department created')
    return result
  }

  async update (id: number, departmentData: Omit<UpdateDepartment, 'updatedAt'>) {
    const db = this.db
    const [result] = await db.table('Departments')
      .where({ id })
      .update({
        ...departmentData,
        updatedAt: new Date()
      })
      .returning([
        'id',
        'name',
        'address',
        'phone',
        'email',
        'chiefName',
        'createdAt',
        'updatedAt'
      ])
    this.logger.info(result, 'Department updated')
    return result
  }
}
