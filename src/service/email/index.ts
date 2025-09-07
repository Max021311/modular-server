import nodemailer from 'nodemailer'
import type { EmailServiceI, SendInviteEmailParams, EmailServiceConfig } from './types'
import type { ModuleConstructorParams } from '#src/service/types'

type ConstructorParams = ModuleConstructorParams<'logger', unknown, EmailServiceConfig>

export class EmailService implements EmailServiceI {
  private readonly transporter: ReturnType<typeof nodemailer['createTransport']>
  private readonly user: string
  private readonly logger: ConstructorParams['context']['logger']
  private readonly enableEmail: boolean

  constructor (params: ConstructorParams) {
    const { user, password, enableEmail } = params.config
    if (!user) throw new Error('Missing user for email service')
    if (!password) throw new Error('Missing password for email service')
    this.enableEmail = enableEmail

    this.user = user
    this.logger = params.context.logger
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user,
        pass: password
      }
    })
  }

  async sendInviteEmail (params: SendInviteEmailParams): Promise<void> {
    try {
      if (!this.enableEmail) {
        this.logger.info(params, 'Send invite email')
        return Promise.resolve()
      }
      const info = await this.transporter.sendMail({
        from: this.user,
        to: params.email,
        subject: 'Completa tu registro',
        text: `Continua tu registro en ${params.completionUrl}`,
        html: `<h1>Continua tu registro en ${params.completionUrl}</h1>`
      })
      this.logger.info({
        messageId: info.messageId,
        previewUrl: nodemailer.getTestMessageUrl(info)
      }, 'Email sent successfully')
    } catch (error) {
      this.logger.error(error, 'Error sending email')
      throw error
    }
  }
}
