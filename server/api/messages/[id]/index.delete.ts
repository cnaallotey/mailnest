import { deleteMessage } from '../../../utils/store'

export default defineEventHandler((event) => {
  if (!deleteMessage(getRouterParam(event, 'id')!)) throw createError({ statusCode: 404 })
  return { ok: true }
})
