import { preHandlerAsyncHookHandler } from 'fastify'
import { HttpError } from '#src/common/error.js'
import jwt from 'jsonwebtoken'
import TOKEN_SCOPES from '#src/common/token-scopes.js'

const { TokenExpiredError, JsonWebTokenError, NotBeforeError } = jwt
const verifyStudentToken: preHandlerAsyncHookHandler = async function verifyStudentToken (request) {
  const { services } = request.server

  const authorization = request.headers.authorization
  if (authorization === undefined) { throw new HttpError('Missing authorization token', 401) }
  const token = authorization.split(' ')[1]

  const payload = await this.services.jwtService().verify(token)
    .catch((error: unknown) => {
      if (error instanceof TokenExpiredError) throw new HttpError(`Authorization token expired at ${error.expiredAt}`, 401)
      if (error instanceof JsonWebTokenError) throw new HttpError('Invalid authorization token', 400)
      if (error instanceof NotBeforeError) throw new HttpError('Invalid token', 401)
      throw error
    })

  if (payload === undefined) { throw new HttpError('Invalid token', 401) }
  if (payload.scope !== TOKEN_SCOPES.STUDENT) { throw new HttpError('Invalid token scope', 401) }

  const student = await services.studentService().findById(payload.id)
  if (student === null) throw new HttpError('Unauthorized', 401)

  request.student = student
}

export default verifyStudentToken
