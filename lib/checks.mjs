// Email checks, link and code extraction. Plain JS so both the server and the `mailnest check` CLI can use it.

/**
 * @typedef {{ level: 'error' | 'warn' | 'info', rule: string, message: string }} Check
 * @param {{ html: string, text: string, subject: string, size?: number }} m
 * @returns {Check[]}
 */
export function runChecks(m) {
  /** @type {Check[]} */
  const out = []
  const add = (level, rule, message) => out.push({ level, rule, message })
  if (!m.subject) add('error', 'subject', 'Message has no subject.')
  if (!m.html) add('info', 'html', 'No HTML part. This is a plain text email.')
  if (m.html && !m.text) add('warn', 'text-part', 'No plain text alternative. Some clients and spam filters expect one.')
  if (Buffer.byteLength(m.html) > 102 * 1024) add('warn', 'gmail-clip', 'HTML is over 102KB. Gmail will clip the message.')
  if (m.html) {
    const imgs = [...m.html.matchAll(/<img\b[^>]*>/gi)].map(x => x[0])
    const noAlt = imgs.filter(t => !/\balt\s*=/i.test(t)).length
    if (noAlt) add('warn', 'img-alt', `${noAlt} image(s) missing alt text.`)
    if (imgs.some(t => /\bsrc\s*=\s*["'](?!https?:|cid:|data:)/i.test(t))) add('error', 'img-relative', 'Image uses a relative URL. It will not load in a real inbox.')
    if (/<script\b/i.test(m.html)) add('error', 'script', 'Contains <script>. Email clients strip or block scripts.')
    if (/<link\b[^>]*rel=["']?stylesheet/i.test(m.html)) add('warn', 'external-css', 'Linked stylesheet. Most clients ignore it, inline your CSS.')
    if (/display\s*:\s*(flex|grid)/i.test(m.html)) add('warn', 'css-layout', 'Uses flex or grid. Outlook desktop and some clients do not support them, use tables.')
    if (/position\s*:\s*(absolute|fixed)/i.test(m.html)) add('warn', 'css-position', 'Uses absolute or fixed positioning. Poorly supported in email.')
    if (!/<meta[^>]+viewport/i.test(m.html)) add('info', 'viewport', 'No viewport meta tag. Mobile rendering may be scaled.')
    const hrefs = [...m.html.matchAll(/href\s*=\s*["']([^"']*)["']/gi)].map(x => x[1])
    if (hrefs.some(h => h === '' || h === '#')) add('warn', 'empty-link', 'Contains an empty or "#" link.')
    if (!/unsubscribe/i.test(m.html) && !/unsubscribe/i.test(m.text)) add('info', 'unsubscribe', 'No unsubscribe link found. Required for marketing mail.')
  }
  return out
}

/** Every distinct http(s) link in the HTML and text parts, in order of appearance. */
export function extractLinks(html, text) {
  const set = new Set()
  for (const x of html.matchAll(/href\s*=\s*["'](https?:\/\/[^"']+)["']/gi)) set.add(x[1].replace(/&amp;/g, '&'))
  for (const x of text.matchAll(/https?:\/\/[^\s<>"')]+/g)) set.add(x[0])
  return [...set]
}

/** Numeric codes of 4 to 8 digits found in the message body (not inside URLs), such as one-time passcodes. */
export function extractCodes(html, text) {
  const body = text || html.replace(/<(style|script)\b[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' ')
  const plain = body.replace(/https?:\/\/\S+/g, ' ')
  return [...new Set(plain.match(/\b\d{4,8}\b/g) || [])].slice(0, 20)
}

/** Inbox names are lower case and limited to letters, digits, dot, dash and underscore. */
export const normalizeInbox = (s) => String(s ?? '').trim().toLowerCase().replace(/[^a-z0-9._-]/g, '-').slice(0, 64)
