import { pino, type LoggerOptions } from 'pino'

export const options: LoggerOptions = {
  level: 'info'
}

export default pino(options)
