import bcrypt from 'bcrypt'
import type { BcryptServiceI } from './types'
import type { ModuleConstructorParams } from '#src/service/types'

type ConstructorParams = ModuleConstructorParams<'logger', unknown>

export class BcryptService implements BcryptServiceI {
  private readonly logger: ConstructorParams['context']['logger']

  constructor (params: ConstructorParams) {
    this.logger = params.context.logger
  }

  async hash (password: string): Promise<string> {
    try {
      const saltRounds = 13
      const hashedPassword = await bcrypt.hash(password, saltRounds)
      return hashedPassword
    } catch (error) {
      this.logger.error(error, 'Error hashing password')
      throw error
    }
  }

  async compare (password: string, hashedPassword: string): Promise<boolean> {
    try {
      const result = await bcrypt.compare(password, hashedPassword)
      return result
    } catch (error) {
      this.logger.error(error, 'Error comparing password')
      throw error
    }
  }
}

