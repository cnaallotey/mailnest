#!/usr/bin/env node
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, resolve } from 'node:path'
import { existsSync } from 'node:fs'
import { exec } from 'node:child_process'

const HELP = `mailnest ${'0.1.0'}  A modern local email catcher

Usage: mailnest [options]

  --smtp-port <n>     SMTP port to listen on        (default 1025)
  --http-port <n>     Web UI and API port           (default 1080)
  --host <addr>       Bind address for the web UI   (default 127.0.0.1)
  --smtp-host <addr>  Bind address for SMTP         (default 0.0.0.0)
  --db <path>         Persist messages to a SQLite file (default in memory)
  --relay <url>       Enable Release via an SMTP URL, e.g. smtp://user:pass@host:587
  --max <n>           Keep at most n messages       (default 500)
  --user <name> --pass <secret>   Require SMTP auth
  --open              Open the UI in your browser
  -h, --help          Show this help
`

const args = process.argv.slice(2)
const env = process.env
const map = { '--smtp-port': 'MAILNEST_SMTP_PORT', '--smtp-host': 'MAILNEST_SMTP_HOST', '--db': 'MAILNEST_DB', '--relay': 'MAILNEST_RELAY_URL', '--max': 'MAILNEST_MAX_MESSAGES', '--user': 'MAILNEST_SMTP_USER', '--pass': 'MAILNEST_SMTP_PASS', '--http-port': 'PORT', '--host': 'HOST' }
let open = false
for (let i = 0; i < args.length; i++) {
  const a = args[i]
  if (a === '-h' || a === '--help') { console.log(HELP); process.exit(0) }
  if (a === '--open') { open = true; continue }
  const [flag, inline] = a.split('=')
  if (map[flag]) { env[map[flag]] = inline ?? args[++i]; continue }
  console.error(`Unknown option: ${a}\n`); console.error(HELP); process.exit(1)
}
env.PORT ||= '1080'
env.HOST ||= '127.0.0.1'
env.NITRO_PORT = env.PORT
env.NITRO_HOST = env.HOST

const entry = resolve(dirname(fileURLToPath(import.meta.url)), '../.output/server/index.mjs')
if (!existsSync(entry)) { console.error('Build output missing. Run "npm run build" first.'); process.exit(1) }

console.log(`[mailnest] UI http://${env.HOST}:${env.PORT}`)
if (open) {
  const url = `http://${env.HOST}:${env.PORT}`
  exec(`${process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start ""' : 'xdg-open'} ${url}`)
}
await import(pathToFileURL(entry).href)
