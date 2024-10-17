import { Knex } from 'knex'
import type { User, CreateUser, UpdateUser } from './user'

declare module 'knex/types/tables' {
  interface Tables {
    Users: Knex.CompositeTableType<User, CreateUser, UpdateUser>
  }
}
