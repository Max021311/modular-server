const TOKEN_SCOPES = {
  USER: 'user',
  INVITE_USER: 'invite-user',
  INVITE_STUDENT: 'invite-student',
  STUDENT: 'student',
  RECOVER_STUDENT_PASSWORD: 'recover-student-password',
  RECOVER_USER_PASSWORD: 'recover-user-password'
} as const

export default TOKEN_SCOPES
