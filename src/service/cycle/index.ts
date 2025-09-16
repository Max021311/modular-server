import type {
  CycleServiceI,
  FindAndCountParams,
  CreateCycle,
  UpdateCycle
} from './types'
import type { ModuleConstructorParams } from '#src/service/types'

type ConstructorParams = ModuleConstructorParams<
  'logger'|'connectionManager',
  never
>

export class CycleService implements CycleServiceI {
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
    return db.table('Cycles')
      .select(
        db.ref('id').withSchema('Cycles'),
        db.ref('slug').withSchema('Cycles'),
        db.ref('isCurrent').withSchema('Cycles'),
        db.ref('createdAt').withSchema('Cycles'),
        db.ref('updatedAt').withSchema('Cycles')
      )
  }

  async findById (id: number) {
    const result = await this.selectQuery.where('Cycles.id', '=', id).first()

    if (!result) {
      return null
    }

    return {
      id: result.id,
      slug: result.slug,
      isCurrent: result.isCurrent,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt
    }
  }

  async findBySlug (slug: string) {
    const result = await this.selectQuery.where('Cycles.slug', '=', slug).first()

    if (!result) {
      return null
    }

    return {
      id: result.id,
      slug: result.slug,
      isCurrent: result.isCurrent,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt
    }
  }

  async findCurrent () {
    const result = await this.selectQuery.where('Cycles.isCurrent', '=', true).first()

    if (!result) {
      return null
    }

    return {
      id: result.id,
      slug: result.slug,
      isCurrent: result.isCurrent,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt
    }
  }

  async findAndCountAll (params: FindAndCountParams) {
    const { limit, offset, order, search } = params
    const db = this.db
    let countQuery = db.table('Cycles')
      .count({ count: '*' }).first()
    let selectQuery = this.selectQuery
      .limit(limit)
      .offset(offset)

    if (order) selectQuery = selectQuery.orderBy([{ column: order[0], order: order[1] }, { column: 'Cycles.id', order: order[1] }])

    if (search) {
      selectQuery = selectQuery
        .whereRaw('"slug" ILIKE (\'%\' || ? || \'%\')', [search])
      countQuery = countQuery
        .whereRaw('"slug" ILIKE (\'%\' || ? || \'%\')', [search])
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
          slug: result.slug,
          isCurrent: result.isCurrent,
          createdAt: result.createdAt,
          updatedAt: result.updatedAt
        }
      })
    }
  }

  async create (cycleData: Omit<CreateCycle, 'createdAt' | 'updatedAt'>) {
    const db = this.db
    const [result] = await db.table('Cycles')
      .insert({
        ...cycleData,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning([
        'id',
        'slug',
        'isCurrent',
        'createdAt',
        'updatedAt'
      ])
    this.logger.info(result, 'Cycle created')
    return result
  }

  async update (id: number, cycleData: Omit<UpdateCycle, 'updatedAt'>) {
    const db = this.db
    const [result] = await db.table('Cycles')
      .where({ id })
      .update({
        ...cycleData,
        updatedAt: new Date()
      })
      .returning([
        'id',
        'slug',
        'isCurrent',
        'createdAt',
        'updatedAt'
      ])
    this.logger.info(result, 'Cycle updated')
    return result
  }

  async setCurrent (id: number) {
    const db = this.db

    return await db.transaction(async (trx) => {
      await trx.table('Cycles').update({ isCurrent: false, updatedAt: new Date() }).where({ isCurrent: true })

      const [result] = await trx.table('Cycles')
        .where({ id })
        .update({
          isCurrent: true,
          updatedAt: new Date()
        })
        .returning([
          'id',
          'slug',
          'isCurrent',
          'createdAt',
          'updatedAt'
        ])

      this.logger.info(result, 'Cycle set as current')
      return result
    })
  }
}

