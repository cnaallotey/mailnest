import { listMessages } from '../../utils/store'

export default defineEventHandler((event) => {
  const q = getQuery(event)
  return listMessages({
    q: q.q ? String(q.q) : undefined,
    to: q.to ? String(q.to) : undefined,
    subject: q.subject ? String(q.subject) : undefined,
    limit: Math.min(+(q.limit ?? 100) || 100, 500),
    offset: +(q.offset ?? 0) || 0,
  })
})
