const configuration = {
  jwtService: {
    secret: process.env.JWT_SECRET ?? 'loremipsum'
  }
} as const

export default configuration
