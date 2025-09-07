import knex from '.'
import { AsyncLocalStorage } from 'node:async_hooks'

const transactionStorage = new AsyncLocalStorage()

async function transaction () {
  return await knex.transaction(
    trx => {
      trx.transaction
    },
    { }
  )
}
