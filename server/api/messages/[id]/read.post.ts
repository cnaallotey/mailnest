import { markRead } from '../../../utils/store'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ read?: boolean }>(event).catch(() => ({} as { read?: boolean }))
  markRead(getRouterParam(event, 'id')!, body?.read ?? true)
  return { ok: true }
})
