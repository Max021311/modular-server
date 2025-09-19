import type { JwtServiceI } from '#src/service/jwt/types.js'
import type { UserServiceI } from '#src/service/user/types.js'
import type { EmailServiceI } from '#src/service/email/types.js'
import type { StudentServiceI } from '#src/service/student/types.js'
import type { BcryptServiceI } from '#src/service/bcrypt/types.js'
import type { CareerServiceI } from '#src/service/career/types.js'
import type { TemplateRenderI } from '#src/service/template-render/types.js'
import type { DepartmentServiceI } from '#src/service/department/types.js'
import type { CycleServiceI } from '#src/service/cycle/types.js'
import type { VacancyServiceI } from '#src/service/vacancy/types.js'
import type { FileServiceI } from './file/types.js'
import type { ComissionOfficeServiceI } from './comission-office/types.js'
import type { BaseLogger } from 'pino'
import type { ConnectionManager } from '#src/common/bd/index.js'

export { BaseLogger as Logger } from 'pino'

export interface Services {
  jwtService: () => JwtServiceI
  userService: () => UserServiceI
  emailService: () => EmailServiceI
  studentService: () => StudentServiceI
  bcryptService: () => BcryptServiceI
  templateRender: () => TemplateRenderI
  careerService: () => CareerServiceI
  departmentService: () => DepartmentServiceI
  cycleService: () => CycleServiceI
  vacancyService: () => VacancyServiceI
  fileService: () => FileServiceI
  comissionOfficeService: () => ComissionOfficeServiceI
}

export interface ApplicationContext <T extends (keyof Services | unknown) = keyof Services> {
  logger: BaseLogger
  connectionManager: ConnectionManager
  services: unknown extends T ? never : Pick<Services, T>
}

export type ModuleConstructorParams<
  T extends keyof ApplicationContext,
  S extends (keyof Services | unknown) = unknown,
  C = unknown
> = { context: Pick<ApplicationContext<S>, T> } & (unknown extends C
  ? { config?: never }
  : { config: C });
