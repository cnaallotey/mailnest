import { getMessage, listAttachments, markRead } from '../../../utils/store'
import { runChecks, extractLinks, extractCodes } from '../../../utils/checks'

export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id')!
  const m = getMessage(id)
  if (!m) throw createError({ statusCode: 404, statusMessage: 'Not found' })
  markRead(id)
  const attachments = listAttachments(id)
  return {
    ...m, read: true, attachments,
    links: extractLinks(m.html, m.text),
    codes: extractCodes(m.html, m.text),
    // The store shows '(no subject)' for display, so pass the real empty subject to the checks.
    checks: runChecks({ html: m.html, text: m.text, subject: m.subject === '(no subject)' ? '' : m.subject, size: m.size }),
  }
})
