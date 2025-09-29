import type {
  FileServiceI,
  CreateFile
} from './types.js'
import type { ModuleConstructorParams } from '#src/service/types.js'
import { put } from '@vercel/blob'
import type { Buffer } from 'node:buffer'
import ENVIRONMENTS from '#src/common/environments.js'

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
        db.ref('url').withSchema('Files'),
        db.ref('createdAt').withSchema('Files'),
        db.ref('updatedAt').withSchema('Files')
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
      url: result.url,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt
    }
  }

  genPath (id: number): string {
    return [process.env.ENVIRONMENT ?? 'development', id].join('/')
  }

  async create (fileData: Omit<CreateFile, 'createdAt' | 'updateddAt'>, file: Buffer) {
    return await this.db.transaction(async (db) => {
      const [result] = await db.table('Files')
        .insert({
          ...fileData,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning('*')

      const blob = await put(this.genPath(result.id), file, {
        access: 'public',
        allowOverwrite: process.env.ENVIRONMENT === ENVIRONMENTS.DEVELOPMENT
      })

      await db.table('Files').update({ url: blob.downloadUrl }).where('id', '=', result.id)

      this.logger.info(result, 'File created and uploaded to Vercel Blob')
      return result
    })
  }
}
