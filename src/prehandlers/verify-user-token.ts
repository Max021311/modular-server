import { type preHandlerAsyncHookHandler } from 'fastify'
import { HttpError } from '../common/error'
import { TokenExpiredError, JsonWebTokenError, NotBeforeError } from 'jsonwebtoken'

const verifyUserToken: preHandlerAsyncHookHandler = async function verifyUserToken (request) {
  const authorization = request.headers.authorization
  if (authorization === undefined) { throw new HttpError('Missing authorization token', 401) }
  const token = authorization.split(' ')[1]
  const payload = await request.server.services.userService().verifyUserToken(token)
    .catch(error => {
      if (error instanceof TokenExpiredError) throw new HttpError(`Authorization token expired at ${error.expiredAt}`, 401)
      if (error instanceof JsonWebTokenError) throw new HttpError('Invalid authorization token', 400)
      if (error instanceof NotBeforeError) throw new HttpError('Invalid token', 401)
      throw error
    })
  request.user = payload
}

export default verifyUserToken
