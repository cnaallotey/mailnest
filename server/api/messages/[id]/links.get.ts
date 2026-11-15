import { getMessage } from '../../../utils/store'
import { extractLinks } from '../../../utils/checks'

// Server side link checker. Only the user's own mail, so no SSRF surface beyond what they already sent themselves.
export default defineEventHandler(async (event) => {
  const m = getMessage(getRouterParam(event, 'id')!)
  if (!m) throw createError({ statusCode: 404 })
  const links = extractLinks(m.html, m.text).slice(0, 50)
  const results: { url: string; status: number | null; ok: boolean; error?: string }[] = []
  let i = 0
  const worker = async () => {
    while (i < links.length) {
      const url = links[i++]
      try {
        let r = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(6000) })
        if (r.status === 405 || r.status === 403) r = await fetch(url, { method: 'GET', redirect: 'follow', signal: AbortSignal.timeout(6000) })
        results.push({ url, status: r.status, ok: r.ok })
      } catch (e) {
        results.push({ url, status: null, ok: false, error: (e as Error).message })
      }
    }
  }
  await Promise.all(Array.from({ length: 6 }, worker))
  return results.sort((a, b) => links.indexOf(a.url) - links.indexOf(b.url))
})
