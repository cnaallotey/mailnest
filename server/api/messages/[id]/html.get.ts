import { getMessage } from '../../../utils/store'

// Serves the HTML body for the sandboxed preview iframe. cid: images are rewritten to attachment URLs.
export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id')!
  const m = getMessage(id)
  if (!m) throw createError({ statusCode: 404 })
  const html = (m.html || `<pre style="font:14px/1.5 ui-monospace,monospace;white-space:pre-wrap">${m.text.replace(/[&<]/g, c => (c === '&' ? '&amp;' : '&lt;'))}</pre>`)
    .replace(/cid:([^"'\s)>]+)/gi, (_, cid) => `/api/messages/${id}/cid/${encodeURIComponent(cid)}`)
  setHeader(event, 'content-type', 'text/html; charset=utf-8')
  setHeader(event, 'content-security-policy', "script-src 'none'; frame-ancestors 'self'")
  return html
})
