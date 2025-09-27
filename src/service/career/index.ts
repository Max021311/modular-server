import type {
  CareerPicked,
  CareerServiceI,
  CareerServiceConfigI,
  FindParams
} from './types.js'
import type { ModuleConstructorParams } from '#src/service/types.js'

type ConstructorParams = ModuleConstructorParams<
  'logger'|'connectionManager',
  undefined,
  CareerServiceConfigI
>

export class CareerService implements CareerServiceI {
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
    return db.table('Careers')
      .select(
        db.ref('id').withSchema('Careers'),
        db.ref('name').withSchema('Careers'),
        db.ref('slug').withSchema('Careers'),
        db.ref('createdAt').withSchema('Careers'),
        db.ref('updatedAt').withSchema('Careers')
      )
  }

  async findAll (params: FindParams = {}): Promise<CareerPicked[]> {
    const { order, search } = params
    let selectQuery = this.selectQuery
    if (search) {
      const { language } = this.config.textSearch
      selectQuery = selectQuery
        .whereRaw('search_vector @@ plainto_tsquery(?, ?)', [language, search])
    }
    if (order) selectQuery = selectQuery.orderBy([{ column: order[0], order: order[1] }, { column: 'Careers.id', order: order[1] }])
    return await selectQuery
  }

  async create (career: Omit<CareerPicked, 'id' | 'createdAt' | 'updatedAt'>): Promise<CareerPicked> {
    const [newCareer] = await this.db
      .table('Careers')
      .insert({
        ...career,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning(['id', 'name', 'slug', 'createdAt', 'updatedAt'])

    return newCareer
  }

  async update (id: number, career: Partial<Omit<CareerPicked, 'id' | 'createdAt' | 'updatedAt'>>): Promise<CareerPicked | null> {
    const [updatedCareer] = await this.db
      .table('Careers')
      .where({ id })
      .update({
        ...career,
        updatedAt: new Date()
      })
      .returning(['id', 'name', 'slug', 'createdAt', 'updatedAt'])

    return updatedCareer || null
  }
}
