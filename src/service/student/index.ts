import type {
  StudentServiceI,
  StudentWithouPassword,
  StudentWithouPasswordFields,
  CreateStudent,
  UpdateStudent,
  FindAndCountParams
} from './types'
import type { ModuleConstructorParams } from '#src/service/types'

type ConstructorParams = ModuleConstructorParams<
  'logger'|'connectionManager',
   unknown
>

const studentWithouPasswordFields = ['id', 'name', 'code', 'careerId', 'email', 'telephone', 'createdAt', 'updatedAt'] as const satisfies StudentWithouPasswordFields[]

export class StudentService implements StudentServiceI {
  private readonly logger: ConstructorParams['context']['logger']
  private readonly connectionManager: ConstructorParams['context']['connectionManager']

  constructor (params: ConstructorParams) {
    this.logger = params.context.logger
    this.connectionManager = params.context.connectionManager
  }

  private get db () {
    return this.connectionManager.getConnection()
  }

  async findAndCount (params: FindAndCountParams) {
    const { limit, offset, order } = params
    const db = this.db
    let recordsQuery = db.table('Students')
      .select(...studentWithouPasswordFields)
      .limit(limit)
      .offset(offset)
    if (order) recordsQuery = recordsQuery.orderBy(order[1], order[0])
    const [total, records] = await Promise.all([
      db.table('Students')
        .count({ count: '*' }).first(),
      recordsQuery
    ])
    return {
      total: total?.count as number,
      records
    }
  }

  async createStudent (studentData: CreateStudent): Promise<StudentWithouPassword> {
    const [result] = await this.db.table('Students')
      .insert({
        ...studentData,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning(studentWithouPasswordFields)
    this.logger.info(result, 'Student created')
    return result
  }

  async updateStudent (id: number, studentData: UpdateStudent): Promise<StudentWithouPassword> {
    const [result] = await this.db.table('Students')
      .where({ id })
      .update({
        ...studentData,
        updatedAt: new Date()
      })
      .returning(studentWithouPasswordFields)
    this.logger.info(result, 'Student updated')
    return result
  }
}
