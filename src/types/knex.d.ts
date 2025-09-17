import { Knex } from 'knex'
import type { User, CreateUser, UpdateUser } from './user'
import type { Student, CreateStudent, UpdateStudent } from './student'
import type { Career, CreateCareer, UpdateCareer } from './career'
import type { Department, CreateDepartment, UpdateDepartment } from './departments'
import type { Cycle, CreateCycle, UpdateCycle } from './cycles'
import type { Vacancy, CreateVacancy, UpdateVacancy } from './vacancy'
import type { VacancyToStudent, CreateVacancyToStudent, UpdateVacancyToStudent } from './vacancyToStudent'

declare module 'knex/types/tables' {
  interface Tables {
    Users: Knex.CompositeTableType<User, CreateUser, UpdateUser>
    Students: Knex.CompositeTableType<Student, CreateStudent, UpdateStudent>
    Careers: Knex.CompositeTableType<Career, CreateCareer, UpdateCareer>
    Departments: Knex.CompositeTableType<Department, CreateDepartment, UpdateDepartment>
    Cycles: Knex.CompositeTableType<Cycle, CreateCycle, UpdateCycle>
    Vacancies: Knex.CompositeTableType<Vacancy, CreateVacancy, UpdateVacancy>
    VacanciesToStudents: Knex.CompositeTableType<VacancyToStudent, CreateVacancyToStudent, UpdateVacancyToStudent>
  }
}
