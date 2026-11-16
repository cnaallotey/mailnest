import { randomBytes } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { selfSigned } from '../../lib/selfsigned.mjs'
import { SMTPServer } from 'smtp-server'
import { simpleParser, type AddressObject } from 'mailparser'
import { config } from './config'
import { bus } from './bus'
import { insertMessage, getSummary, listWebhooks, type Address } from './store'
import { normalizeInbox } from './checks'

const addrs = (a?: AddressObject | AddressObject[]): Address[] =>
  (Array.isArray(a) ? a : a ? [a] : []).flatMap(o => o.value.map(v => ({ name: v.name || '', address: v.address || '' })))

function headersToObject(map: Map<string, any>) {
  const out: Record<string, string> = {}
  for (const [k, v] of map) {
    out[k] = typeof v === 'string' ? v : v?.text ?? v?.value?.map?.((x: any) => x.address || x).join?.(', ') ?? JSON.stringify(v)
  }
  return out
}

async function fireWebhooks(payload: unknown) {
  for (const w of listWebhooks()) {
    fetch(w.url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload), signal: AbortSignal.timeout(5000) })
      .catch(() => {})
  }
}

// A message goes to a named inbox when a recipient uses a plus tag such as ama+worker-1@user.test, or
// when the sender logged in with a username (unless Mailnest is locked to one account with --user).
// The plus tag wins, because many apps send placeholder SMTP credentials in development.
function pickInbox(envelope: { to: string[]; user?: string }) {
  for (const to of envelope.to) {
    const tag = /^[^+@]+\+([^@]+)@/.exec(to)?.[1]
    if (tag) return normalizeInbox(tag)
  }
  if (envelope.user && !config.authUser) return normalizeInbox(envelope.user)
  return ''
}

export async function ingest(raw: Buffer, envelope: { from?: string; to: string[]; user?: string }) {
  const p = await simpleParser(raw, { keepCidLinks: true })
  const id = randomBytes(6).toString('hex')
  insertMessage({
    id,
    inbox: pickInbox(envelope),
    createdAt: Date.now(),
    from: addrs(p.from)[0] ?? (envelope.from ? { name: '', address: envelope.from } : null),
    to: addrs(p.to),
    cc: addrs(p.cc),
    envelopeFrom: envelope.from || '',
    envelopeTo: envelope.to,
    subject: p.subject || '',
    html: typeof p.html === 'string' ? p.html : '',
    text: p.text || '',
    headers: headersToObject(p.headers),
    raw,
    attachments: p.attachments.map(a => ({
      filename: a.filename || 'attachment',
      contentType: a.contentType,
      size: a.size,
      cid: (a.cid || '').replace(/^<|>$/g, ''),
      content: a.content,
    })),
  })
  const s = getSummary(id)!
  bus.emit('message', s)
  fireWebhooks({ event: 'message.received', message: s })
  return s
}

type G = typeof globalThis & { __mailnestSmtp?: SMTPServer; __mailnestTls?: { key: string; cert: string; generated: boolean } }
const g = globalThis as G

// The key and certificate used for STARTTLS, or null when TLS is off. With --tls alone, a self-signed
// certificate is made in memory on each start. With --tls-key and --tls-cert, those files are used.
export function tlsMaterial() {
  if (!config.tls) return null
  return (g.__mailnestTls ||= config.tlsKey && config.tlsCert
    ? { key: readFileSync(config.tlsKey, 'utf8'), cert: readFileSync(config.tlsCert, 'utf8'), generated: false }
    : { ...selfSigned({ hosts: ['localhost', 'host.docker.internal', '127.0.0.1', '::1'] }), generated: true })
}

export function startSmtp() {
  if (g.__mailnestSmtp) return g.__mailnestSmtp
  const tls = tlsMaterial()
  const server = new SMTPServer({
    authOptional: true,
    allowInsecureAuth: true,
    // Plain SMTP always works. STARTTLS is offered as an upgrade only when TLS is turned on.
    ...(tls ? { key: tls.key, cert: tls.cert } : { disabledCommands: ['STARTTLS'] }),
    size: config.maxSizeMb * 1024 * 1024,
    onAuth(auth, _session, cb) {
      if (config.authUser && (auth.username !== config.authUser || auth.password !== config.authPass)) {
        return cb(new Error('Invalid credentials'))
      }
      cb(null, { user: auth.username || '' })
    },
    onData(stream, session, cb) {
      const chunks: Buffer[] = []
      stream.on('data', c => chunks.push(c))
      stream.on('end', async () => {
        try {
          await ingest(Buffer.concat(chunks), {
            from: session.envelope.mailFrom ? session.envelope.mailFrom.address : '',
            to: session.envelope.rcptTo.map(r => r.address),
            user: typeof session.user === 'string' ? session.user : '',
          })
          cb()
        } catch (e) { cb(e as Error) }
      })
    },
  })
  server.on('error', err => console.error('[mailnest] SMTP error:', err.message))
  server.listen(config.smtpPort, config.smtpHost, () => {
    console.log(`[mailnest] SMTP listening on ${config.smtpHost}:${config.smtpPort}${tls ? ` (STARTTLS on, ${tls.generated ? 'self-signed certificate' : 'your certificate'})` : ''}`)
  })
  g.__mailnestSmtp = server
  return server
}
