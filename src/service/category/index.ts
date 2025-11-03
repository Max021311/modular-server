import type {
  CategoryServiceI,
  CreateCategory,
  UpdateCategory
} from './types.js'
import type { ModuleConstructorParams } from '#src/service/types.js'

type ConstructorParams = ModuleConstructorParams<
  'logger'|'connectionManager',
  never
>

export class CategoryService implements CategoryServiceI {
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

  async findAll () {
    const results = await this.selectQuery.orderBy('Categories.name', 'asc')

    return results.map((result) => ({
      id: result.id,
      name: result.name,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt
    }))
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