// Client compatibility report: which HTML and CSS features an email uses, and which email clients do
// not support them. Support data comes from Can I email (see lib/caniemail.json and scripts/update-caniemail.mjs).

// Clients most recipients use. Problems here are shown first.
export const MAJOR = ['gmail', 'apple-mail', 'outlook', 'yahoo', 'samsung-email']
// Rarely used variants of major clients. They are listed, but do not raise a problem's level on their own.
const NICHE = new Set(['gmail:mobile-webmail'])

/** The CSS in an email: every <style> block plus every inline style attribute, without comments. */
export function extractCss(html) {
  const parts = []
  for (const m of html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) parts.push(m[1])
  for (const m of html.matchAll(/\sstyle\s*=\s*(?:"([^"]*)"|'([^']*)')/gi)) parts.push(`{${m[1] ?? m[2]}}`)
  return parts.join('\n').replace(/\/\*[\s\S]*?\*\//g, ' ')
}

let compiled
function compile(data) {
  if (compiled?.data !== data) compiled = { data, list: data.features.map(f => ({ f, re: new RegExp(f.re, 'i') })) }
  return compiled.list
}

// ['gmail:ios', 'gmail:android#1'] -> [{ family: 'gmail', name: 'Gmail', major: true, platforms: ['iOS', 'Android'], notes: [...] }]
function group(keys, f, data) {
  const by = new Map()
  for (const key of keys) {
    const [id, nums] = key.split('#')
    const [family, platform] = id.split(':')
    if (!by.has(family)) by.set(family, { family, name: data.families[family] ?? family, major: false, platforms: [], notes: [] })
    const g = by.get(family)
    if (MAJOR.includes(family) && !NICHE.has(id)) g.major = true
    g.platforms.push(data.platforms[platform] ?? platform)
    for (const n of nums ? nums.split(',') : []) {
      const note = f.notes?.[n]
      if (note && !g.notes.includes(note)) g.notes.push(note)
    }
  }
  const rank = c => { const i = MAJOR.indexOf(c.family); return i < 0 ? MAJOR.length : i }
  return [...by.values()].sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name))
}

/**
 * @param {string} html the email's HTML part
 * @param {object} data the parsed lib/caniemail.json
 */
export function compatReport(html, data) {
  const css = extractCss(html)
  const features = []
  for (const { f, re } of compile(data)) {
    if (!re.test(f.in === 'css' ? css : html)) continue
    const unsupported = group(f.no, f, data)
    const partial = group(f.partial, f, data)
    // error: a major client drops it. warn: a major client supports it only partly. info: only smaller clients are affected.
    const level = unsupported.some(c => c.major) ? 'error' : partial.some(c => c.major) ? 'warn' : 'info'
    features.push({ slug: f.slug, title: f.title, category: f.category, url: `https://www.caniemail.com/features/${f.slug}/`, level, unsupported, partial })
  }
  const order = { error: 0, warn: 1, info: 2 }
  const weight = x => x.unsupported.filter(c => c.major).length * 10 + x.partial.filter(c => c.major).length
  features.sort((a, b) => order[a.level] - order[b.level] || weight(b) - weight(a) || a.title.localeCompare(b.title))

  // Per client totals, so the UI can say "Outlook: 6 unsupported".
  const clients = new Map()
  const bump = (c, k) => {
    if (!clients.has(c.family)) clients.set(c.family, { family: c.family, name: c.name, major: c.major, unsupported: 0, partial: 0 })
    clients.get(c.family)[k]++
  }
  for (const x of features) { x.unsupported.forEach(c => bump(c, 'unsupported')); x.partial.forEach(c => bump(c, 'partial')) }
  const rank = c => { const i = MAJOR.indexOf(c.family); return i < 0 ? MAJOR.length : i }

  return {
    updated: data.updated,
    counts: { error: features.filter(x => x.level === 'error').length, warn: features.filter(x => x.level === 'warn').length, info: features.filter(x => x.level === 'info').length },
    clients: [...clients.values()].sort((a, b) => rank(a) - rank(b) || b.unsupported - a.unsupported || a.name.localeCompare(b.name)),
    features,
  }
}
