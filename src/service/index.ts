import lazyLoad from '#src/common/lazyload.js'
import type { Services, Logger, ApplicationContext } from './types.js'
import configuration from '#src/common/configuration.js'
import { JwtService } from './jwt/index.js'
import { UserService } from './user/index.js'
import { EmailService } from './email/index.js'
import { StudentService } from './student/index.js'
import { BcryptService } from './bcrypt/index.js'
import { TemplateRender } from './template-render/index.js'
import { DepartmentService } from './department/index.js'
import { CycleService } from './cycle/index.js'
import { ConnectionManager } from '#src/common/bd/index.js'
import { CareerService } from './career/index.js'
import { VacancyService } from './vacancy/index.js'
import { FileService } from './file/index.js'
import { ComissionOfficeService } from './comission-office/index.js'

interface GetServicesParams {
  logger: Logger
  connectionManager: ConnectionManager
}

export function getServices (params: GetServicesParams): Services {
  const { logger, connectionManager } = params
  const context = {
    logger,
    connectionManager,
    services: {} as ApplicationContext['services']
  } as ApplicationContext
  context.services.jwtService = lazyLoad((p) => new JwtService(p), {
    context,
    config: {
      secret: configuration.jwtService.secret
    }
  })
  context.services.userService = lazyLoad((p) => new UserService(p), {
    context
  })
  context.services.emailService = lazyLoad((p) => new EmailService(p), {
    context,
    config: {
      user: configuration.email.user,
      password: configuration.email.pass,
      enableEmail: configuration.email.enableEmail
    }
  })
  context.services.studentService = lazyLoad((p) => new StudentService(p), {
    context,
    config: {
      textSearch: configuration.textSearch
    }
  })
  context.services.bcryptService = lazyLoad((p) => new BcryptService(p), {
    context
  })
  context.services.templateRender = lazyLoad((p) => new TemplateRender(p), {
    context
  })
  context.services.careerService = lazyLoad((p) => new CareerService(p), {
    context
  })
  context.services.departmentService = lazyLoad((p) => new DepartmentService(p), {
    context,
    config: {
      textSearch: configuration.textSearch
    }
  })
  context.services.cycleService = lazyLoad((p) => new CycleService(p), {
    context
  })
  context.services.vacancyService = lazyLoad((p) => new VacancyService(p), {
    context,
    config: {
      textSearch: configuration.textSearch
    }
  })
  context.services.fileService = lazyLoad((p) => new FileService(p), {
    context
  })
  context.services.comissionOfficeService = lazyLoad((p) => new ComissionOfficeService(p), {
    context
  })
  return context.services
}
