import { getAttachmentByCid } from '../../../../utils/store'

export default defineEventHandler((event) => {
  const a = getAttachmentByCid(getRouterParam(event, 'id')!, decodeURIComponent(getRouterParam(event, 'cid')!))
  if (!a) throw createError({ statusCode: 404 })
  setHeader(event, 'content-type', a.contentType)
  return Buffer.from(a.content)
})
