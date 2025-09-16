import type { JwtServiceI } from '#src/service/jwt/types'
import type { UserServiceI } from '#src/service/user/types'
import type { EmailServiceI } from '#src/service/email/types'
import type { StudentServiceI } from '#src/service/student/types'
import type { BcryptServiceI } from '#src/service/bcrypt/types'
import type { CareerServiceI } from '#src/service/career/types'
import type { TemplateRenderI } from '#src/service/template-render/types'
import type { BaseLogger } from 'pino'
import type { ConnectionManager } from '#src/common/bd'

export { BaseLogger as Logger } from 'pino'

export interface Services {
  jwtService: () => JwtServiceI
  userService: () => UserServiceI
  emailService: () => EmailServiceI
  studentService: () => StudentServiceI
  bcryptService: () => BcryptServiceI
  templateRender: () => TemplateRenderI
  careerService: () => CareerServiceI
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
