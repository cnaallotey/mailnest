import { getAttachment } from '../../../../utils/store'

export default defineEventHandler((event) => {
  const a = getAttachment(getRouterParam(event, 'id')!, +getRouterParam(event, 'idx')!)
  if (!a) throw createError({ statusCode: 404 })
  setHeader(event, 'content-type', a.contentType)
  setHeader(event, 'content-disposition', `attachment; filename="${encodeURIComponent(a.filename)}"`)
  return Buffer.from(a.content)
})
