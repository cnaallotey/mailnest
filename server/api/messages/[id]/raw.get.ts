import { getRaw } from '../../../utils/store'

export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id')!
  const raw = getRaw(id)
  if (!raw) throw createError({ statusCode: 404 })
  setHeader(event, 'content-type', 'message/rfc822')
  if (getQuery(event).download) setHeader(event, 'content-disposition', `attachment; filename="${id}.eml"`)
  return Buffer.from(raw)
})
