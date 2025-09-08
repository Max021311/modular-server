import { UserWithoutPassword } from '#src/types/user'

import {
  type PERMISSIONS,
  type Roles,
  DEFAULT_ROLE_PERMISSIONS
} from './permissions'

function loadPermissions (user: UserWithoutPassword) : PERMISSIONS[] {
  const role: keyof Roles = user.role ?? 'base'
  const extraPermissions = DEFAULT_ROLE_PERMISSIONS[role]
  return [...(user?.permissions ?? []), ...extraPermissions]
}

export default loadPermissions
