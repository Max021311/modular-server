import { Knex } from 'knex'
import type { User, CreateUser, UpdateUser } from './user'
import type { Student, CreateStudent, UpdateStudent } from './student'
import type { Career, CreateCareer, UpdateCareer } from './career'

declare module 'knex/types/tables' {
  interface Tables {
    Users: Knex.CompositeTableType<User, CreateUser, UpdateUser>
    Students: Knex.CompositeTableType<Student, CreateStudent, UpdateStudent>
    Careers: Knex.CompositeTableType<Career, CreateCareer, UpdateCareer>
  }
}
