import { VercelRequest, VercelResponse } from '@vercel/node'
import build from './build'

const server = build()

export default async (req: VercelRequest, res: VercelResponse) => {
  await server.ready()
  server.server.emit('request', req, res)
}
