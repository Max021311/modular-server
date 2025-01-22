import knex from 'knex'

export default knex({
  client: 'pg',
  connection: {
    // connectionString: process.env.DATABASE_URL,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL ? { rejectUnauthorized: false } : false
  }
})
