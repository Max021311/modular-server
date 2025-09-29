import nodemailer from 'nodemailer'
import type {
  EmailServiceI,
  SendInviteStudentEmailParams,
  SendInviteUserEmailParams,
  EmailServiceConfig,
  SendEmailParams,
  SendRecoverStudentPassword,
  SendRecoverUserPassword
} from './types.js'
import type { ModuleConstructorParams } from '#src/service/types.js'

type ConstructorParams = ModuleConstructorParams<'logger'|'services', 'templateRender', EmailServiceConfig>

export class EmailService implements EmailServiceI {
  private readonly transporter: ReturnType<typeof nodemailer['createTransport']>
  private readonly user: string
  private readonly logger: ConstructorParams['context']['logger']
  private readonly templateRender: ConstructorParams['context']['services']['templateRender']
  private readonly enableEmail: boolean

  constructor (params: ConstructorParams) {
    const { user, password, enableEmail } = params.config
    if (!user) throw new Error('Missing user for email service')
    if (!password) throw new Error('Missing password for email service')
    this.enableEmail = enableEmail

    this.templateRender = params.context.services.templateRender

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

  async sendEmail (params: SendEmailParams): Promise<void> {
    try {
      const info = await this.transporter.sendMail({
        from: this.user,
        to: params.to,
        subject: params.subject,
        text: params.text,
        html: params.html
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

  async sendInviteStudentEmail (params: SendInviteStudentEmailParams): Promise<void> {
    const text = this.templateRender().render({
      template: 'invite-student',
      file: 'body.txt',
      data: {
        completionUrl: params.completionUrl
      }
    })
    const html = this.templateRender().render({
      template: 'invite-student',
      file: 'body.html',
      data: {
        completionUrl: params.completionUrl
      }
    })
    const subject = this.templateRender().render({
      template: 'invite-student',
      file: 'subject.txt',
      data: {
        completionUrl: params.completionUrl
      }
    })
    if (!this.enableEmail) {
      this.logger.info({
        params,
        subject,
        text
      }, 'Send invite email')
      return Promise.resolve()
    }
    await this.sendEmail({
      to: params.email,
      subject,
      text,
      html
    })
  }

  async sendInviteUserEmail (params: SendInviteUserEmailParams): Promise<void> {
    const text = this.templateRender().render({
      template: 'invite-user',
      file: 'body.txt',
      data: {
        completionUrl: params.completionUrl
      }
    })
    const html = this.templateRender().render({
      template: 'invite-user',
      file: 'body.html',
      data: {
        completionUrl: params.completionUrl
      }
    })
    const subject = this.templateRender().render({
      template: 'invite-user',
      file: 'subject.txt',
      data: {
        completionUrl: params.completionUrl
      }
    })
    if (!this.enableEmail) {
      this.logger.info({
        params,
        subject,
        text
      }, 'Send invite email')
      return Promise.resolve()
    }
    await this.sendEmail({
      to: params.email,
      subject,
      text,
      html
    })
  }

  async sendRecoverStudentPassword (params: SendRecoverStudentPassword): Promise<void> {
    const text = this.templateRender().render({
      template: 'recover-student-password',
      file: 'body.txt',
      data: {
        url: params.url
      }
    })
    const html = this.templateRender().render({
      template: 'recover-student-password',
      file: 'body.html',
      data: {
        url: params.url
      }
    })
    const subject = this.templateRender().render({
      template: 'recover-student-password',
      file: 'subject.txt',
      data: {
        url: params.url
      }
    })
    if (!this.enableEmail) {
      this.logger.info({
        params,
        subject,
        text
      }, 'Send recover student password email')
      return Promise.resolve()
    }
    await this.sendEmail({
      to: params.email,
      subject,
      text,
      html
    })
  }

  async sendRecoverUserPassword (params: SendRecoverUserPassword): Promise<void> {
    const text = this.templateRender().render({
      template: 'recover-user-password',
      file: 'body.txt',
      data: {
        url: params.url
      }
    })
    const html = this.templateRender().render({
      template: 'recover-user-password',
      file: 'body.html',
      data: {
        url: params.url
      }
    })
    const subject = this.templateRender().render({
      template: 'recover-user-password',
      file: 'subject.txt',
      data: {
        url: params.url
      }
    })
    if (!this.enableEmail) {
      this.logger.info({
        params,
        subject,
        text
      }, 'Send recover student password email')
      return Promise.resolve()
    }
    await this.sendEmail({
      to: params.email,
      subject,
      text,
      html
    })
  }
}
