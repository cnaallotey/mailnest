import { removeWebhook } from '../../utils/store'

export default defineEventHandler((event) => {
  if (!removeWebhook(getRouterParam(event, 'id')!)) throw createError({ statusCode: 404 })
  return { ok: true }
})
