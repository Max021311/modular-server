import type {
  PreferenceSystemServiceI,
  SuggestParams,
  PreferenceSystemServiceConfigI
} from './types.js'
import type { ModuleConstructorParams } from '#src/service/types.js'
import axios, { type AxiosInstance } from 'axios'

type ConstructorParams = ModuleConstructorParams<
  'logger'|'services',
  never,
  PreferenceSystemServiceConfigI
>

export class PreferenceSystemService implements PreferenceSystemServiceI {
  private readonly logger: ConstructorParams['context']['logger']
  private readonly services: ConstructorParams['context']['services']
  private readonly client: AxiosInstance

  constructor (params: ConstructorParams) {
    this.logger = params.context.logger
    this.services = params.context.services
    this.client = axios.create({
      baseURL: params.config.url,
      headers: {
        Authorization: `Token ${params.config.apiKey}`,
        'Content-Type': 'application/json'
      }
    })
  }

  async suggest (params: SuggestParams): Promise<number[]> {
    const { categoryId, location, schedule } = params

    try {
      const response = await this.client.post<Array<{ id: number }>>('/recomendar', {
        categoryID: categoryId,
        location,
        schedule
      })

      return response.data.map(item => item.id)
    } catch (error) {
      this.logger.error({ error }, 'Error calling preference system')
      return []
    }
  }
}
