export interface SendInviteEmailParams {
  email: string
  completionUrl: string
}

export interface EmailServiceConfig {
  user: string
  password: string,
  enableEmail: boolean
}

export interface EmailServiceI {
  sendInviteEmail(params: SendInviteEmailParams): Promise<void>
}
