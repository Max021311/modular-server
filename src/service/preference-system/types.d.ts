export interface SuggestParams {
  categoryId?: number
  location?: 'north' | 'south' | 'east' | 'west' | 'center'
  schedule?: 'morning' | 'afternoon' | 'saturday'
}

export interface PreferenceSystemServiceI {
  suggest(params: SuggestParams): Promise<number[]>
}

export interface PreferenceSystemServiceConfigI {
  url: string
  apiKey: string
}
