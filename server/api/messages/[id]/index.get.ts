import { getMessage, listAttachments, markRead } from '../../../utils/store'
import { runChecks } from '../../../utils/checks'

export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id')!
  const m = getMessage(id)
  if (!m) throw createError({ statusCode: 404, statusMessage: 'Not found' })
  markRead(id)
  const attachments = listAttachments(id)
  return { ...m, read: true, attachments, checks: runChecks({ html: m.html, text: m.text, subject: m.subject, size: m.size }) }
})
