import type {
  CategoryServiceI,
  CategoryServiceConfigI,
  CreateCategory,
  UpdateCategory,
  FindParams
} from './types.js'
import type { ModuleConstructorParams } from '#src/service/types.js'

type ConstructorParams = ModuleConstructorParams<
  'logger'|'connectionManager',
  undefined,
  CategoryServiceConfigI
>

export class CategoryService implements CategoryServiceI {
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
    return db.table('Categories')
      .select(
        db.ref('id').withSchema('Categories'),
        db.ref('name').withSchema('Categories'),
        db.ref('createdAt').withSchema('Categories'),
        db.ref('updatedAt').withSchema('Categories')
      )
  }

  async get (id: number) {
    const result = await this.selectQuery.where('Categories.id', '=', id).first()

    if (!result) {
      return null
    }

    return {
      id: result.id,
      name: result.name,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt
    }
  }

  async findAll (params: FindParams = {}) {
    const { order, search } = params
    let selectQuery = this.selectQuery
    if (search) {
      const { language } = this.config.textSearch
      selectQuery = selectQuery
        .whereRaw('search_vector @@ plainto_tsquery(?, ?)', [language, search])
    }
    if (order) selectQuery = selectQuery.orderBy([{ column: order[0], order: order[1] }, { column: 'Categories.id', order: order[1] }])
    else selectQuery = selectQuery.orderBy('Categories.name', 'asc')

    return await selectQuery
  }

  async create (categoryData: Omit<CreateCategory, 'createdAt' | 'updatedAt'>) {
    const db = this.db
    const [result] = await db.table('Categories')
      .insert({
        ...categoryData,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning([
        'id',
        'name',
        'createdAt',
        'updatedAt'
      ])
    this.logger.info(result, 'Category created')
    return result
  }

  async update (id: number, categoryData: Omit<UpdateCategory, 'updatedAt'>) {
    const db = this.db
    const [result] = await db.table('Categories')
      .where({ id })
      .update({
        ...categoryData,
        updatedAt: new Date()
      })
      .returning([
        'id',
        'name',
        'createdAt',
        'updatedAt'
      ])
    this.logger.info(result, 'Category updated')
    return result
  }
}
