export interface TemplateDefinition {
  template: string
  file: string
  data: Record<string, unknown>
}

export interface InviteStudent extends TemplateDefinition {
  template: 'invite-student'
  file: 'body.html' | 'body.txt' | 'subject.txt'
  data: {
    completionUrl: string
  }
}

export interface InviteUser extends TemplateDefinition {
  template: 'invite-user'
  file: 'body.html' | 'body.txt' | 'subject.txt'
  data: {
    completionUrl: string
  }
}

type RenderParams = InviteStudent | InviteUser

export interface TemplateRenderI {
  render(params: RenderParams): string
}
