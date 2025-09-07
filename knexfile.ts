import type { Knex } from "knex";
import DotEnv from  'dotenv'
DotEnv.config()

const config: Knex.Config = {
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
  pool: {
    min: 0,
    max: 10
  },
  migrations: {
    tableName: "knex_migrations",
    directory: './src/migrations',
    extension: 'ts'
  },
  seeds: {
    directory: './src/seeds',
    extension: 'ts'
  }
}

export default config;
