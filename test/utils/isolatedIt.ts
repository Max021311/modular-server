import { it } from 'vitest'
import connectionManager from '#src/common/bd'

const ROLLBACK = Symbol('ROLLBACK')

export function isolatedIt(title: string, fn: () => Promise<void>, timeout?: number): void {
  // eslint-disable-next-line @typescript-eslint/promise-function-async
  it(
    title,
    async function () {
      await connectionManager.withTransaction(async (_t) => {
        await fn()
        // eslint-disable-next-line @typescript-eslint/no-throw-literal
        throw ROLLBACK
      })
      .catch((err) => {
        if (err === ROLLBACK) return
        throw err
      })
    },
    timeout
  )
}
