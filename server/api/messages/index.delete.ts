import { clearMessages } from '../../utils/store'
import { normalizeInbox } from '../../utils/checks'
import { bus } from '../../utils/bus'

// DELETE /api/messages clears everything. DELETE /api/messages?inbox=name clears only that inbox.
export default defineEventHandler((event) => {
  const q = getQuery(event)
  const inbox = q.inbox ? normalizeInbox(q.inbox) : ''
  clearMessages(inbox || undefined)
  bus.emit('cleared', inbox)
  return { ok: true }
})
