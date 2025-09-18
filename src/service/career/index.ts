import type {
  Career,
  CareerServiceI
} from './types.js'
import type { ModuleConstructorParams } from '#src/service/types.js'

type ConstructorParams = ModuleConstructorParams<
  'logger'|'connectionManager'
>

export class CareerService implements CareerServiceI {
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
    return db.table('Careers')
      .select(
        db.ref('id').withSchema('Careers'),
        db.ref('name').withSchema('Careers'),
        db.ref('slug').withSchema('Careers'),
        db.ref('createdAt').withSchema('Careers'),
        db.ref('updatedAt').withSchema('Careers')
      )
  }

  async findAll (): Promise<Career[]> {
    return await this.selectQuery
  }
}
