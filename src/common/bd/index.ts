import knex, { type Knex } from 'knex'
import { AsyncLocalStorage } from 'node:async_hooks'

type WithTransactionCallback<T> = (trx: Knex.Transaction) => Promise<T>

interface TransactionStorageContext {
  transaction: Knex.Transaction
}

const transactionStorage = new AsyncLocalStorage<TransactionStorageContext>()

const pg = knex({
  client: 'pg',
  connection: {
    // connectionString: process.env.DATABASE_URL,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL ? { rejectUnauthorized: false } : false
  },
  pool: { min: 0, max: 10 }
})

export class ConnectionManager {
  async withTransaction <T> (callback: WithTransactionCallback<T>, options?: Knex.TransactionConfig) {
    const context = transactionStorage.getStore()
    if (context?.transaction !== undefined) {
      return callback(context.transaction)
    }
    return pg.transaction<T>(
      async (transaction) => {
        return await transactionStorage.run({ transaction }, () => callback(transaction))
      },
      options
    )
  }

  getConnection () {
    const context = transactionStorage.getStore()
    return context?.transaction ?? pg
  }
}

export default new ConnectionManager()
