import { HttpError } from '#src/common/error.js'
import bcrypt from 'bcrypt'
import type { UserTokenPayload } from '#src/service/jwt/types.js'
import TOKEN_SCOPES from '#src/common/token-scopes.js'
import type {
  UserServiceI,
  CreateUser,
  FindAndCountParams,
  UserServiceConfigI
} from './types.js'
import type { ModuleConstructorParams } from '#src/service/types.js'
import loadPermissions from '#src/common/load-permissions.js'

type ConstructorParams = ModuleConstructorParams<
  'logger'|'services'|'connectionManager',
  'jwtService',
  UserServiceConfigI
>

export class UserService implements UserServiceI {
  private readonly logger: ConstructorParams['context']['logger']
  private readonly services: ConstructorParams['context']['services']
  private readonly connectionManager: ConstructorParams['context']['connectionManager']
  private readonly config: ConstructorParams['config']

  constructor (params: ConstructorParams) {
    this.logger = params.context.logger
    this.services = params.context.services
    this.connectionManager = params.context.connectionManager
    this.config = params.config
  }

  private get db () {
    return this.connectionManager.getConnection()
  }

  private users () {
    return this.db.table('Users').select('id', 'name', 'user', 'role', 'permissions', 'createdAt', 'updatedAt')
  }

  /**
   * @throws {HttpError}
  */
  async login (email: string, password: string): Promise<string> {
    const user = await this.users().select('password').first().where('user', email)
    if (!user) { throw new HttpError('Wrong user or password', 401) }

    const result = await bcrypt.compare(password, user.password)
    if (!result) { throw new HttpError('Wrong user or password', 401) }

    return await this.services.jwtService().sign({
      id: user.id,
      name: user.name,
      user: user.user,
      role: user.role,
      permissions: loadPermissions(user),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      scope: 'user'
    })
  }

  async getById (id: number) {
    return await this.users()
      .first()
      .where('id', id)
  }

  async getByEmail (email: string) {
    return await this.users()
      .first()
      .where('user', email)
  }

  async create (user: CreateUser) {
    const db = this.db
    const [result] = await db.table('Users')
      .insert({
        ...user,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning([
        'id',
        'name',
        'user',
        'role',
        'permissions',
        'createdAt',
        'updatedAt'
      ])
    this.logger.info(result, 'User created')
    return result
  }

  /**
   * @deprecated
   */
  async verifyUserToken (jwt: string) {
    const payload = await this.services.jwtService().verify(jwt)
    if (payload === undefined) { throw new HttpError('Invalid token', 401) }
    if (payload.scope !== TOKEN_SCOPES.USER) { throw new HttpError('Invalid token scope', 401) }
    const user = await this.getById(payload.id)
    if (user === undefined) throw new HttpError('Unauthorized', 401)
    return payload as UserTokenPayload
  }

  async findAndCount (params: FindAndCountParams = {}) {
    const { limit = 10, offset = 0, search, order } = params
    const db = this.db

    let countQuery = db.table('Users').count({ count: '*' }).first()
    let selectQuery = this.users()
      .limit(limit)
      .offset(offset)

    if (order) {
      selectQuery = selectQuery.orderBy([
        { column: order[0], order: order[1] },
        { column: 'Users.id', order: order[1] }
      ])
    } else {
      selectQuery = selectQuery.orderBy('id', 'desc')
    }

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
      records,
      total: Number(total?.count ?? 0)
    }
  }
}
