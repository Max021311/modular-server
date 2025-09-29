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

export interface RecoverStudentPassword extends TemplateDefinition {
  template: 'recover-student-password'
  file: 'body.html' | 'body.txt' | 'subject.txt'
  data: {
    url: string
  }
}

export interface RecoverUserPassword extends TemplateDefinition {
  template: 'recover-user-password'
  file: 'body.html' | 'body.txt' | 'subject.txt'
  data: {
    url: string
  }
}

export interface ReportStatusChange extends TemplateDefinition {
  template: 'report-status-change'
  file: 'body.html' | 'body.txt' | 'subject.txt'
  data: {
    studentName: string
    vacancyName: string
    cycleName: string
    status: 'aprobado' | 'rechazado'
  }
}

export interface FinalReportStatusChange extends TemplateDefinition {
  template: 'final-report-status-change'
  file: 'body.html' | 'body.txt' | 'subject.txt'
  data: {
    studentName: string
    vacancyName: string
    cycleName: string
    status: 'aprobado' | 'rechazado'
  }
}

export interface ComissionOfficeStatusChange extends TemplateDefinition {
  template: 'comission-office-status-change'
  file: 'body.html' | 'body.txt' | 'subject.txt'
  data: {
    studentName: string
    vacancyName: string
    cycleName: string
    status: 'aprobado' | 'rechazado'
  }
}

type RenderParams = InviteStudent
| InviteUser
| RecoverStudentPassword
| RecoverUserPassword
| ReportStatusChange
| FinalReportStatusChange
| ComissionOfficeStatusChange

export interface TemplateRenderI {
  render(params: RenderParams): string
}
