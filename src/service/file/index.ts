import type {
  FileServiceI,
  CreateFile
} from './types.js'
import type { ModuleConstructorParams } from '#src/service/types.js'

type ConstructorParams = ModuleConstructorParams<
  'logger'|'connectionManager',
  never
>

export class FileService implements FileServiceI {
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
    return db.table('Files')
      .select(
        db.ref('id').withSchema('Files'),
        db.ref('name').withSchema('Files'),
        db.ref('createdAt').withSchema('Files'),
        db.ref('updateddAt').withSchema('Files')
      )
  }

  async getById (id: number) {
    const result = await this.selectQuery.where('Files.id', '=', id).first()

    if (!result) {
      return null
    }

    return {
      id: result.id,
      name: result.name,
      createdAt: result.createdAt,
      updateddAt: result.updateddAt
    }
  }

  async create (fileData: Omit<CreateFile, 'createdAt' | 'updateddAt'>) {
    const db = this.db
    const [result] = await db.table('Files')
      .insert({
        ...fileData,
        createdAt: new Date(),
        updateddAt: new Date()
      })
      .returning([
        'id',
        'name',
        'createdAt',
        'updateddAt'
      ])
    this.logger.info(result, 'File created')
    return result
  }
}

