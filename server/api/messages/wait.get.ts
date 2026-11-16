import { bus } from '../../utils/bus'
import { listMessages, type MessageSummary } from '../../utils/store'
import { normalizeInbox } from '../../utils/checks'

// Test helper: block until a matching message exists. /api/messages/wait?to=a@b.c&subject=Welcome&inbox=worker-1&timeout=10000
export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const to = q.to ? String(q.to).toLowerCase() : ''
  const subject = q.subject ? String(q.subject).toLowerCase() : ''
  const timeout = Math.min(+(q.timeout ?? 10000) || 10000, 60000)
  const since = +(q.since ?? 0) || 0
  const inbox = q.inbox ? normalizeInbox(q.inbox) : ''
  const matches = (m: MessageSummary) =>
    m.createdAt >= since &&
    (!inbox || m.inbox === inbox) &&
    (!to || [...m.to.map(a => a.address), ...m.envelopeTo].some(a => a.toLowerCase().includes(to))) &&
    (!subject || m.subject.toLowerCase().includes(subject))

  const existing = listMessages({ to: to || undefined, subject: subject || undefined, inbox: inbox || undefined, limit: 1 }).messages.find(matches)
  if (existing) return existing

  return await new Promise<MessageSummary>((resolve, reject) => {
    const done = (m: MessageSummary) => { clearTimeout(t); bus.off('message', on); resolve(m) }
    const on = (m: MessageSummary) => { if (matches(m)) done(m) }
    const t = setTimeout(() => { bus.off('message', on); reject(createError({ statusCode: 408, statusMessage: 'Timed out waiting for message' })) }, timeout)
    bus.on('message', on)
  })
})
