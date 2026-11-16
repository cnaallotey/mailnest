import { getMessage } from '../../../utils/store'

// Styles added to the preview only. They never change the stored message.
const INVERT_CSS = `<style data-mailnest-preview>
html { background: #fff; filter: invert(1) hue-rotate(180deg); }
img, video, picture, svg, [background], [style*="background-image"], [style*="background:url"], [style*="background: url"] { filter: invert(1) hue-rotate(180deg); }
</style>`

function inject(html: string, extra: string) {
  return /<\/head>/i.test(html) ? html.replace(/<\/head>/i, `${extra}</head>`) : extra + html
}

// ?scheme=dark   shows the email as a client that honours prefers-color-scheme: dark would (Apple Mail, Outlook on macOS).
// ?scheme=invert approximates clients that recolour every email themselves (Gmail on Android and iOS, Outlook on Windows).
function applyScheme(html: string, scheme: string) {
  if (scheme === 'invert') return inject(html, INVERT_CSS)
  if (scheme !== 'dark') return html
  // The preview cannot change the browser's real colour scheme, so make the dark media queries always match.
  let out = html
    .replace(/\(\s*prefers-color-scheme\s*:\s*dark\s*\)/gi, '(min-width: 0px)')
    .replace(/\(\s*prefers-color-scheme\s*:\s*light\s*\)/gi, '(max-width: 0px)')
  // An email that declares dark support also gets the browser's dark defaults, as it would in a mail client.
  const declaresDark = /<meta\b[^>]*name\s*=\s*["']?(?:supported-)?color-schemes?["']?[^>]*\bdark\b/i.test(html) || /color-scheme\s*:[^;}]*\bdark\b/i.test(html)
  if (declaresDark) out = inject(out, '<style data-mailnest-preview>:root { color-scheme: dark !important; }</style>')
  return out
}

// Serves the HTML body for the sandboxed preview iframe. cid: images are rewritten to attachment URLs.
export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id')!
  const m = getMessage(id)
  if (!m) throw createError({ statusCode: 404 })
  const html = (m.html || `<pre style="font:14px/1.5 ui-monospace,monospace;white-space:pre-wrap">${m.text.replace(/[&<]/g, c => (c === '&' ? '&amp;' : '&lt;'))}</pre>`)
    .replace(/cid:([^"'\s)>]+)/gi, (_, cid) => `/api/messages/${id}/cid/${encodeURIComponent(cid)}`)
  setHeader(event, 'content-type', 'text/html; charset=utf-8')
  setHeader(event, 'content-security-policy', "script-src 'none'; frame-ancestors 'self'")
  return applyScheme(html, String(getQuery(event).scheme || ''))
})
