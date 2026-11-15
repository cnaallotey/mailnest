import { randomBytes } from 'node:crypto'
import { addWebhook } from '../../utils/store'

export default defineEventHandler(async (event) => {
  const { url } = await readBody<{ url: string }>(event)
  try { new URL(url) } catch { throw createError({ statusCode: 400, statusMessage: 'Invalid URL' }) }
  const id = randomBytes(4).toString('hex')
  addWebhook(id, url)
  return { id, url }
})
