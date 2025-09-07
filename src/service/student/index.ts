import type {
  StudentServiceI,
  StudentWithouPassword,
  StudentWithCareer,
  CreateStudent,
  UpdateStudent,
  FindAndCountParams,
  FindByIdOpts
} from './types'
import type { ModuleConstructorParams } from '#src/service/types'
import { type Knex } from 'knex'

type ConstructorParams = ModuleConstructorParams<
  'logger'|'connectionManager',
   unknown
>

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

  private get selectQuery () {
    const db = this.db
    return db.table('Students')
      .select(
        db.ref('id').withSchema('Students'),
        db.ref('name').withSchema('Students'),
        db.ref('code').withSchema('Students'),
        db.ref('careerId').withSchema('Students'),
        db.ref('email').withSchema('Students'),
        db.ref('telephone').withSchema('Students'),
        db.ref('createdAt').withSchema('Students'),
        db.ref('updatedAt').withSchema('Students')
      )
  }

  private applyCareerJoin <T extends typeof this.selectQuery> (query: T) {
    const db = this.db
    return query.leftJoin('Careers', 'Students.careerId', '=', 'Careers.id')
      .select(
        db.ref('id').withSchema('Careers').as('career_id'),
        db.ref('name').withSchema('Careers').as('career_name'),
        db.ref('slug').withSchema('Careers').as('career_slug'),
        db.ref('createdAt').withSchema('Careers').as('career_createdAt'),
        db.ref('updatedAt').withSchema('Careers').as('career_updatedAt')
      )
  }

  async findAndCount (params: FindAndCountParams) {
    const { limit, offset, order, includeCareer } = params
    const db = this.db
    const baseSelectQuery = this.selectQuery
      .limit(limit)
      .offset(offset)
    let selectQuery: typeof this.selectQuery | ReturnType<typeof this.applyCareerJoin> = baseSelectQuery

    if (includeCareer === true) selectQuery = this.applyCareerJoin(selectQuery)

    if (order) selectQuery = selectQuery.orderBy(order[0], order[1])

    const [total, records] = await Promise.all([
      db.table('Students')
        .count({ count: '*' }).first(),
      selectQuery
    ])
    return {
      total: total?.count as number,
      records: records.map((result) => {
        return {
          id: result.id,
          name: result.name,
          code: result.code,
          careerId: result.careerId,
          email: result.email,
          telephone: result.telephone,
          createdAt: result.createdAt,
          updatedAt: result.updatedAt,
          career: 'career_id' in result
            ? {
                id: result.career_id,
                name: result.career_name,
                slug: result.career_slug,
                createdAt: result.career_createdAt,
                updatedAt: result.career_updatedAt
              }
            : undefined
        }
      })
    }
  }

  async createStudent (studentData: CreateStudent) {
    const db = this.db
    const [result] = await db.table('Students')
      .insert({
        ...studentData,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning([
        'id',
        'name',
        'code',
        'careerId',
        'email',
        'telephone',
        'createdAt',
        'updatedAt'
      ])
    this.logger.info(result, 'Student created')
    return result
  }

  async updateStudent (id: number, studentData: UpdateStudent): Promise<StudentWithouPassword> {
    const db = this.db
    const [result] = await db.table('Students')
      .where({ id })
      .update({
        ...studentData,
        updatedAt: new Date()
      })
      .returning([
        'id',
        'name',
        'code',
        'careerId',
        'email',
        'telephone',
        'createdAt',
        'updatedAt'
      ])
    this.logger.info(result, 'Student updated')
    return result
  }

  async findById (id: number, opts: FindByIdOpts): Promise<StudentWithCareer | null> {
    const includeCareer = opts.includeCareer ?? false
    const baseQuery = this.selectQuery
    let selectQuery: typeof this.selectQuery | ReturnType<typeof this.applyCareerJoin> = baseQuery

    if (includeCareer) selectQuery = this.applyCareerJoin(selectQuery)

    const result = await selectQuery.first()

    if (!result) {
      return null
    }

    return {
      id: result.id,
      name: result.name,
      code: result.code,
      careerId: result.careerId,
      email: result.email,
      telephone: result.telephone,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      career: 'career_id' in result
        ? {
            id: result.career_id,
            name: result.career_name,
            slug: result.career_slug,
            createdAt: result.career_createdAt,
            updatedAt: result.career_updatedAt
          }
        : undefined
    }
  }
}
