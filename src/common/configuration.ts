const configuration = {
  jwtService: {
    secret: process.env.JWT_SECRET ?? 'loremipsum'
  },
  webUrl: process.env.WEB_URL ?? 'http://localhost:3000',
  textSearch: {
    language: process.env.TEXT_SEARCH_LANGUAGE ?? 'spanish'
  },
  email: {
    user: process.env.EMAIL_USER ?? '',
    pass: process.env.EMAIL_PASSWORD ?? '',
    enableEmail: (process.env.EMAIL_ENABLE ?? '') === 'true'
  },
  environment: process.env.ENVIRONMENT ?? 'development',
  preferenceSystem: {
    url: process.env.PREFERENCE_SYSTEM_URL ?? 'http://localhost:3010',
    apiKey: process.env.PREFERENCE_SYSTEM_API_KEY ?? ''
  }
} as const

export default configuration
