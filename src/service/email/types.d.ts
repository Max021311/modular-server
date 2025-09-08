export interface SendEmailParams {
  to: string | string[],
  subject: string,
  text: string,
  html: string
}

export interface SendInviteStudentEmailParams {
  email: string
  completionUrl: string
}

export interface SendInviteUserEmailParams {
  email: string
  completionUrl: string
}

export interface EmailServiceConfig {
  user: string
  password: string,
  enableEmail: boolean
}

export interface EmailServiceI {
  sendEmail(params): Promise<void>
  sendInviteStudentEmail(params: SendInviteStudentEmailParams): Promise<void>
  sendInviteUserEmail(params: SendInviteUserEmailParams): Promise<void>
}
