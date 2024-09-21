import { type preHandlerAsyncHookHandler } from 'fastify'
import { HttpError } from '../common/error'
import userService from '../service/user'

const verifyUserToken: preHandlerAsyncHookHandler = async function verifyUserToken (request) {
  const authorization = request.headers.authorization
  if (authorization === undefined) { throw new HttpError('Missing authorization token', 401) }
  const token = authorization.split(' ')[1]
  const payload = await userService.verifyUserToken(token)
  request.user = payload
}

export default verifyUserToken
