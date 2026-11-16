// `mailnest check <files...>`: run the email checks on template files without starting the server.
import { readFileSync, readdirSync, statSync, globSync, existsSync } from 'node:fs'
import { extname, join, relative } from 'node:path'
import { runChecks } from '../lib/checks.mjs'

const HELP = `Usage: mailnest check <files, folders or globs...> [options]

Runs the Mailnest email checks on .html, .htm and .eml files.

  --fail-on <level>   Exit with code 1 when a problem at this level or worse is found:
                      error (default), warn, info, or never
  --ignore <rules>    Comma separated rule names to skip, e.g. --ignore unsubscribe,viewport
  --json              Print the results as JSON
  -h, --help          Show this help

Examples:
  mailnest check emails/
  mailnest check "emails/**/*.html" --fail-on warn
`

const LEVELS = { error: 3, warn: 2, info: 1 }
const EXTS = new Set(['.html', '.htm', '.eml'])
// A bare HTML file is only the HTML part, so rules about the rest of the message do not apply to it.
const HTML_ONLY_SKIP = new Set(['subject', 'text-part', 'html'])

function walk(dir, out) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name.startsWith('.')) continue
    const p = join(dir, e.name)
    if (e.isDirectory()) walk(p, out)
    else if (EXTS.has(extname(e.name).toLowerCase())) out.push(p)
  }
}

function collect(patterns) {
  const files = []
  for (const p of patterns) {
    if (/[*?[\]{}]/.test(p) && !existsSync(p)) {
      // fs.globSync is still marked experimental on some Node 22 releases. Hide that one warning.
      const emit = process.emitWarning
      process.emitWarning = (w, ...rest) => { if (!String(rest[0]?.type ?? rest[0] ?? w).includes('Experimental')) emit.call(process, w, ...rest) }
      try { files.push(...globSync(p).filter(f => statSync(f).isFile())) } finally { process.emitWarning = emit }
    } else if (!existsSync(p)) {
      throw new Error(`No such file or folder: ${p}`)
    } else if (statSync(p).isDirectory()) walk(p, files)
    else files.push(p)
  }
  return [...new Set(files)].sort()
}

async function load(file) {
  const raw = readFileSync(file)
  if (extname(file).toLowerCase() !== '.eml') return { html: raw.toString('utf8'), text: '', subject: '', partial: true }
  const { simpleParser } = await import('mailparser')
  const p = await simpleParser(raw)
  return { html: typeof p.html === 'string' ? p.html : '', text: p.text || '', subject: p.subject || '', partial: false }
}

/** @returns {Promise<number>} the process exit code */
export async function runCheck(argv) {
  let failOn = 'error', json = false
  const ignore = new Set(), patterns = []
  for (let i = 0; i < argv.length; i++) {
    const [flag, inline] = argv[i].split('=')
    if (flag === '-h' || flag === '--help') { console.log(HELP); return 0 }
    else if (flag === '--json') json = true
    else if (flag === '--fail-on') failOn = inline ?? argv[++i]
    else if (flag === '--ignore') { for (const r of String(inline ?? argv[++i] ?? '').split(',')) { if (r.trim()) ignore.add(r.trim()) } }
    else if (flag.startsWith('-')) { console.error(`Unknown option: ${flag}\n\n${HELP}`); return 2 }
    else patterns.push(argv[i])
  }
  if (failOn !== 'never' && !LEVELS[failOn]) { console.error(`--fail-on must be error, warn, info or never (got "${failOn}")`); return 2 }
  if (!patterns.length) { console.error(HELP); return 2 }

  let files
  try { files = collect(patterns) } catch (e) { console.error(e.message); return 2 }
  if (!files.length) { console.error('No .html, .htm or .eml files matched.'); return 2 }

  const results = []
  for (const file of files) {
    const m = await load(file)
    const checks = runChecks(m).filter(c => !ignore.has(c.rule) && !(m.partial && HTML_ONLY_SKIP.has(c.rule)))
    const rel = relative(process.cwd(), file)
    results.push({ file: rel && !rel.startsWith('..') ? rel : file, checks })
  }

  const count = { error: 0, warn: 0, info: 0 }
  for (const r of results) for (const c of r.checks) count[c.level]++
  const failed = failOn !== 'never' && results.some(r => r.checks.some(c => LEVELS[c.level] >= LEVELS[failOn]))

  if (json) {
    console.log(JSON.stringify({ ok: !failed, files: results.length, ...count, results }, null, 2))
    return failed ? 1 : 0
  }

  const tty = process.stdout.isTTY && !process.env.NO_COLOR
  const paint = (code, s) => (tty ? `\x1b[${code}m${s}\x1b[0m` : s)
  const tint = { error: s => paint(31, s), warn: s => paint(33, s), info: s => paint(36, s) }
  for (const r of results) {
    if (!r.checks.length) { console.log(`${paint(32, '✓')} ${r.file}`); continue }
    console.log(`\n${paint(1, r.file)}`)
    for (const c of r.checks.sort((a, b) => LEVELS[b.level] - LEVELS[a.level])) {
      console.log(`  ${tint[c.level](c.level.padEnd(5))}  ${c.message}  ${paint(2, c.rule)}`)
    }
  }
  const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`
  console.log(`\n${plural(results.length, 'file')} checked: ${plural(count.error, 'error')}, ${plural(count.warn, 'warning')}, ${count.info} info`)
  return failed ? 1 : 0
}
