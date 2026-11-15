export interface Check { level: 'error' | 'warn' | 'info'; rule: string; message: string }

export function runChecks(m: { html: string; text: string; subject: string; size: number }): Check[] {
  const out: Check[] = []
  const add = (level: Check['level'], rule: string, message: string) => out.push({ level, rule, message })
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

export function extractLinks(html: string, text: string) {
  const set = new Set<string>()
  for (const x of html.matchAll(/href\s*=\s*["'](https?:\/\/[^"']+)["']/gi)) set.add(x[1].replace(/&amp;/g, '&'))
  for (const x of text.matchAll(/https?:\/\/[^\s<>"')]+/g)) set.add(x[0])
  return [...set]
}
