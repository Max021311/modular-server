import lazyLoad from '#src/common/lazyload'
import type { Services, Logger, ApplicationContext } from './types'
import configuration from '#src/common/configuration'
import { JwtService } from './jwt'
import { UserService } from './user'
import { EmailService } from './email'
import { StudentService } from './student'
import { BcryptService } from './bcrypt'
import { TemplateRender } from './template-render/'
import { ConnectionManager } from '#src/common/bd'
import { config } from 'process'

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
  return context.services
}
