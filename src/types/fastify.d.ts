import { UserWithoutPassword } from '#src/service/user/types'
import { StudentWithouPassword } from '#src/service/student/types'

declare module 'fastify' {
  interface FastifyRequest {
    user: UserWithoutPassword
    student: StudentWithouPassword
  }
}
