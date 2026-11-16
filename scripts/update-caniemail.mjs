#!/usr/bin/env node
// Regenerates lib/caniemail.json from the Can I email dataset (https://www.caniemail.com, MIT licensed).
// Usage: node scripts/update-caniemail.mjs [path-to-data.json]
//
// The output keeps only features that at least one client does not fully support, the latest test
// result per client, and a regular expression that detects the feature in an email's HTML or CSS.
import { readFileSync, writeFileSync } from 'node:fs'

const SOURCE = 'https://www.caniemail.com/api/data.json'
const src = process.argv[2]
const raw = src ? JSON.parse(readFileSync(src, 'utf8')) : await (await fetch(SOURCE)).json()

const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
// A CSS property at the start of a declaration, so `width` does not match `max-width`.
const prop = names => `(?:^|[;{\\s"'])(?:${names.map(esc).join('|')})\\s*:`
const propRe = re => `(?:^|[;{\\s"'])(?:${re})\\s*:`
const value = (p, v) => `(?:^|[;{\\s"'])${esc(p)}\\s*:\\s*(?:[a-z-]+\\s+)*${esc(v)}\\b`
const anyValue = re => `:[^;{}]*(?:${re})`
const fn = names => `\\b(?:${names.map(esc).join('|')})\\(`
const unit = u => `[\\d.]${esc(u)}(?![\\w%])`
const tag = names => `<(?:${names.join('|')})\\b`
const attr = names => `<[a-z][^>]*\\s(?:${names.map(esc).join('|')})\\s*=`
const boolAttr = names => `<[a-z][^>]*\\s(?:${names.map(esc).join('|')})(?:[\\s>=/])`
const ext = e => `(?:src|href|srcset|background)\\s*=\\s*["'][^"']*\\.(?:${e})(?:[?#"'\\s])|url\\(\\s*["']?[^)"']*\\.(?:${e})(?:[?#"')\\s])`

// Features whose title does not follow a pattern we can read automatically.
const SPECIAL = {
  'css-at-media-device-pixel-ratio': ['css', '@media[^{]*device-pixel-ratio'],
  'css-at-media-hover': ['css', '@media[^{]*\\(\\s*(?:any-)?hover'],
  'css-at-media-orientation': ['css', '@media[^{]*\\(\\s*orientation'],
  'css-at-media-prefers-color-scheme': ['css', '@media[^{]*prefers-color-scheme'],
  'css-at-media-prefers-reduced-motion': ['css', '@media[^{]*prefers-reduced-motion'],
  'css-block-inline-size': ['css', prop(['block-size', 'inline-size'])],
  'css-border-inline-block': ['css', propRe('border-(?:inline|block)(?:-[a-z-]+)?')],
  'css-border-radius-logical': ['css', propRe('border-(?:start|end)-(?:start|end)-radius')],
  'css-column-layout-properties': ['css', propRe('columns|column-(?:width|rule|span|fill)(?:-[a-z]+)?')],
  'css-gap': ['css', prop(['gap', 'column-gap', 'row-gap'])],
  'css-grid-template': ['css', propRe('grid-template(?:-[a-z]+)?')],
  'css-important': ['css', '!\\s*important'],
  'css-intrinsic-size': ['css', anyValue('\\b(?:fit|min|max)-content\\b')],
  'css-left-right-top-bottom': ['css', prop(['left', 'right', 'top', 'bottom'])],
  'css-margin-block-start-end': ['css', prop(['margin-block-start', 'margin-block-end'])],
  'css-margin-inline-block': ['css', prop(['margin-inline', 'margin-block'])],
  'css-margin-inline-start-end': ['css', prop(['margin-inline-start', 'margin-inline-end'])],
  'css-padding-block-start-end': ['css', prop(['padding-block-start', 'padding-block-end'])],
  'css-padding-inline-block': ['css', prop(['padding-inline', 'padding-block'])],
  'css-padding-inline-start-end': ['css', prop(['padding-inline-start', 'padding-inline-end'])],
  'css-pseudo-class-lang': ['css', ':lang\\('],
  'css-scroll-snap': ['css', propRe('scroll-snap-[a-z-]+')],
  'css-sytem-ui': ['css', anyValue('\\b(?:system-ui|ui-serif|ui-sans-serif|ui-rounded|ui-monospace)\\b')],
  'css-unit-calc': ['css', fn(['calc'])],
  'css-unit-initial': ['css', ':\\s*initial\\b'],
  'css-unit-percent': ['css', '\\d%'],
  'css-variables': ['css', '\\bvar\\(\\s*--|(?:^|[;{\\s"\'])--[\\w-]+\\s*:'],
  'html-address': ['html', tag(['address'])],
  'html-anchor-links': ['html', 'href\\s*=\\s*["\']#[\\w-]'],
  'html-base': ['html', tag(['base'])],
  'html-button-reset': ['html', '<button\\b[^>]*type\\s*=\\s*["\']?reset'],
  'html-button-submit': ['html', '<button\\b[^>]*type\\s*=\\s*["\']?submit'],
  'html-h1-h6': ['html', '<h[1-6]\\b'],
  'html-image-maps': ['html', '<map\\b|\\susemap\\s*='],
  'html-lists': ['html', tag(['ul', 'ol', 'dl'])],
  'html-mailto-links': ['html', 'href\\s*=\\s*["\']mailto:'],
  'html-meta-color-scheme': ['html', '<meta\\b[^>]*name\\s*=\\s*["\']?(?:supported-)?color-schemes?\\b'],
  'html-semantics': ['html', tag(['article', 'aside', 'details', 'figcaption', 'figure', 'footer', 'header', 'main', 'mark', 'nav', 'section', 'summary', 'time'])],
  'html-srcset': ['html', attr(['srcset'])],
  'html-svg': ['html', tag(['svg'])],
  'html-hidden': ['html', boolAttr(['hidden'])],
  'html-required': ['html', boolAttr(['required'])],
  'html-popover': ['html', boolAttr(['popover'])],
  'css-inert-attribute': ['html', boolAttr(['inert'])],
  'image-apng': ['html', ext('apng')],
  'image-avif': ['html', ext('avif')],
  'image-base64': ['html', '(?:src\\s*=\\s*["\']|url\\(\\s*["\']?)data:image/'],
  'image-bmp': ['html', ext('bmp')],
  'image-gif': ['html', ext('gif')],
  'image-heif': ['html', ext('heif|heic')],
  'image-ico': ['html', ext('ico')],
  'image-jpg': ['html', ext('jpe?g')],
  'image-mp4': ['html', '<img\\b[^>]*\\.mp4'],
  'image-png': ['html', ext('png')],
  'image-svg': ['html', ext('svg')],
  'image-tiff': ['html', ext('tiff?')],
  'image-webp': ['html', ext('webp')],
}
// Too broad or not detectable from the markup alone.
const SKIP = new Set(['amp', 'bimi', 'css-comments', 'css-nesting', 'html-comments', 'html-doctype', 'html-command-attribute',
  'css-border-inline-block-individual', 'css-border-inline-block-longhand', 'image-hdr', 'html-body'])

function matcher(f) {
  if (SKIP.has(f.slug) || f.slug.startsWith('css-selector-')) return null
  if (SPECIAL[f.slug]) return SPECIAL[f.slug]
  const t = f.title.trim()
  let m
  if (f.category === 'css') {
    if ((m = /^css-unit-([a-z]+)$/.exec(f.slug))) return ['css', unit(m[1])]
    if ((m = /^@([a-z-]+)$/.exec(t))) return ['css', `@${m[1]}\\b`]
    if ((m = /^css-pseudo-class-(.+)$/.exec(f.slug))) return ['css', `[^:]:${esc(m[1])}(?![\\w-])`]
    if ((m = /^css-pseudo-element-(.+)$/.exec(f.slug))) return ['css', `::?${esc(m[1])}(?![\\w-])`]
    if (/\(\)/.test(t)) return ['css', fn([...t.matchAll(/([a-z-]+)\(\)/g)].map(x => x[1]))]
    if ((m = /^([a-z-]+):\s*([a-z-]+)$/.exec(t))) return ['css', value(m[1], m[2])]
    if ((m = /^([a-z-]+)(?: property| CSS property| shorthand)?$/.exec(t))) return ['css', prop([m[1]])]
  }
  if (f.category === 'html') {
    if ((m = /^<([a-z0-9]+)> element$/.exec(t))) return ['html', tag([m[1]])]
    if ((m = /^<input type="([a-z]+)"> element$/.exec(t))) return ['html', `<input\\b[^>]*type\\s*=\\s*["']?${m[1]}`]
    if ((m = /^([a-z-]+) attribute$/.exec(t))) return ['html', attr([m[1]])]
  }
  return null
}

const features = [], unmatched = []
for (const f of raw.data) {
  const no = [], partial = [], notes = {}
  for (const [family, platforms] of Object.entries(f.stats)) {
    for (const [platform, versions] of Object.entries(platforms)) {
      const latest = Object.values(versions).at(-1) || 'u'
      const key = `${family}:${platform}`
      if (latest[0] === 'n') no.push(key)
      else if (latest[0] === 'a') {
        const nums = [...latest.matchAll(/#(\d+)/g)].map(x => x[1])
        for (const n of nums) if (f.notes_by_num?.[n]) notes[n] = f.notes_by_num[n].replace(/<[^>]+>/g, '').slice(0, 240)
        partial.push(nums.length ? `${key}#${nums.join(',')}` : key)
      }
    }
  }
  if (!no.length && !partial.length) continue // works everywhere, nothing to report
  const m = matcher(f)
  if (!m) { unmatched.push(f.slug); continue }
  new RegExp(m[1], 'i') // throws here if a pattern is invalid
  features.push({ slug: f.slug, title: f.title.trim(), category: f.category, in: m[0], re: m[1], no, partial, ...(Object.keys(notes).length ? { notes } : {}) })
}

const out = {
  source: SOURCE,
  license: 'MIT, https://github.com/hteumeuleu/caniemail',
  updated: String(raw.last_update_date).slice(0, 10),
  families: raw.nicenames.family,
  platforms: raw.nicenames.platform,
  features,
}
writeFileSync(new URL('../lib/caniemail.json', import.meta.url), JSON.stringify(out) + '\n')
console.log(`Wrote lib/caniemail.json: ${features.length} features (data from ${out.updated}).`)
console.log(`Skipped ${unmatched.length} with no detector: ${unmatched.join(', ')}`)
