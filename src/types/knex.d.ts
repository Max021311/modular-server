import { Knex } from 'knex'
import type { User, CreateUser, UpdateUser } from './user.js'
import type { Student, CreateStudent, UpdateStudent } from './student.js'
import type { Career, CreateCareer, UpdateCareer } from './career.js'
import type { Department, CreateDepartment, UpdateDepartment } from './departments.js'
import type { Cycle, CreateCycle, UpdateCycle } from './cycles.js'
import type { Vacancy, CreateVacancy, UpdateVacancy } from './vacancy.js'
import type { VacancyToStudent, CreateVacancyToStudent, UpdateVacancyToStudent } from './vacancyToStudent.js'
import type { ComissionOffice, CreateComissionOffice, UpdateComissionOffice } from './comission-office.js'
import type { FinalReport, CreateFinalReport, UpdateFinalReport } from './final-report.js'
import type { Report, CreateReport, UpdateReport } from './report.js'
import type { File, CreateFile, UpdateFile } from './file.js'
import type { Category, CreateCategory, UpdateCategory } from './category.js'

declare module 'knex/types/tables.js' {
  interface Tables {
    Users: Knex.CompositeTableType<User, CreateUser, UpdateUser>
    Students: Knex.CompositeTableType<Student, CreateStudent, UpdateStudent>
    Careers: Knex.CompositeTableType<Career, CreateCareer, UpdateCareer>
    Departments: Knex.CompositeTableType<Department, CreateDepartment, UpdateDepartment>
    Cycles: Knex.CompositeTableType<Cycle, CreateCycle, UpdateCycle>
    Vacancies: Knex.CompositeTableType<Vacancy, CreateVacancy, UpdateVacancy>
    VacanciesToStudents: Knex.CompositeTableType<VacancyToStudent, CreateVacancyToStudent, UpdateVacancyToStudent>
    ComissionOffices: Knex.CompositeTableType<ComissionOffice, CreateComissionOffice, UpdateComissionOffice>
    FinalReports: Knex.CompositeTableType<FinalReport, CreateFinalReport, UpdateFinalReport>
    Reports: Knex.CompositeTableType<Report, CreateReport, UpdateReport>
    Files: Knex.CompositeTableType<File, CreateFile, UpdateFile>
    Categories: Knex.CompositeTableType<Category, CreateCategory, UpdateCategory>
  }
}
