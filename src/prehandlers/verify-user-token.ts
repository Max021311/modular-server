import { type preHandlerAsyncHookHandler } from 'fastify'
import { HttpError } from '../common/error.js'
import jwt from 'jsonwebtoken'
import TOKEN_SCOPES from '#src/common/token-scopes.js'
import { type PERMISSIONS } from '#src/common/permissions.js'
import loadPermissions from '#src/common/load-permissions.js'
const { TokenExpiredError, JsonWebTokenError, NotBeforeError } = jwt

function targetContains (arr: string[], target: string[]): boolean {
  return target.every(value => arr.includes(value))
}

function buildVerifyUserToken (permissionGuards: PERMISSIONS[]) {
  const verifyUserToken: preHandlerAsyncHookHandler = async function verifyUserToken (request) {
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
    if (payload.scope !== TOKEN_SCOPES.USER) { throw new HttpError('Invalid token scope', 401) }

    const user = await services.userService().getById(payload.id)
    if (user === undefined) throw new HttpError('Unauthorized', 401)

    const userPermissions = loadPermissions(user)
    if (!targetContains(userPermissions, permissionGuards)) {
      throw new HttpError('You don\'t have permissions to perform this action. Contact your administrator to request permissions.', 403)
    }

    request.user = user
  }
  return verifyUserToken
}

export default buildVerifyUserToken
