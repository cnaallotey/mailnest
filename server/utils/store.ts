import { DatabaseSync } from 'node:sqlite'
import { config } from './config'

export interface Address { name: string; address: string }
export interface MessageSummary {
  id: string
  createdAt: number
  from: Address | null
  to: Address[]
  cc: Address[]
  envelopeTo: string[]
  subject: string
  size: number
  read: boolean
  attachmentCount: number
  snippet: string
  /** Named inbox this message was routed to, or '' for none. */
  inbox: string
}
export interface MessageFull extends MessageSummary {
  html: string
  text: string
  headers: Record<string, string>
}
export interface NewMessage {
  id: string
  inbox: string
  createdAt: number
  from: Address | null
  to: Address[]
  cc: Address[]
  envelopeFrom: string
  envelopeTo: string[]
  subject: string
  html: string
  text: string
  headers: Record<string, string>
  raw: Buffer
  attachments: { filename: string; contentType: string; size: number; cid: string; content: Buffer }[]
}

type G = typeof globalThis & { __mailnestDb?: DatabaseSync }
const g = globalThis as G

function open() {
  const db = new DatabaseSync(config.db)
  db.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY, created_at INTEGER NOT NULL,
      from_json TEXT, to_json TEXT, cc_json TEXT,
      envelope_from TEXT, envelope_to TEXT,
      subject TEXT, html TEXT, text TEXT, headers_json TEXT,
      raw BLOB, size INTEGER, read INTEGER DEFAULT 0, snippet TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);
    CREATE TABLE IF NOT EXISTS attachments (
      message_id TEXT NOT NULL, idx INTEGER NOT NULL,
      filename TEXT, content_type TEXT, size INTEGER, cid TEXT, content BLOB,
      PRIMARY KEY (message_id, idx)
    );
    CREATE TABLE IF NOT EXISTS webhooks (id TEXT PRIMARY KEY, url TEXT NOT NULL);
  `)
  // Databases created before named inboxes existed need the column added.
  const cols = db.prepare('PRAGMA table_info(messages)').all() as { name: string }[]
  if (!cols.some(c => c.name === 'inbox')) db.exec(`ALTER TABLE messages ADD COLUMN inbox TEXT NOT NULL DEFAULT ''`)
  db.exec('CREATE INDEX IF NOT EXISTS idx_messages_inbox ON messages(inbox)')
  return db
}

export const db = (g.__mailnestDb ||= open())

const j = (s: unknown) => (typeof s === 'string' && s ? JSON.parse(s) : null)

function summary(r: any): MessageSummary {
  return {
    id: r.id,
    createdAt: r.created_at,
    from: j(r.from_json),
    to: j(r.to_json) || [],
    cc: j(r.cc_json) || [],
    envelopeTo: j(r.envelope_to) || [],
    subject: r.subject || '(no subject)',
    size: r.size,
    read: !!r.read,
    attachmentCount: r.attachment_count ?? 0,
    snippet: r.snippet || '',
    inbox: r.inbox || '',
  }
}

const SUMMARY_COLS = `m.id, m.created_at, m.from_json, m.to_json, m.cc_json, m.envelope_to, m.subject, m.size, m.read, m.snippet, m.inbox,
  (SELECT COUNT(*) FROM attachments a WHERE a.message_id = m.id) AS attachment_count`

export function insertMessage(m: NewMessage) {
  db.prepare(`INSERT INTO messages (id, created_at, from_json, to_json, cc_json, envelope_from, envelope_to, subject, html, text, headers_json, raw, size, snippet, inbox)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
    m.id, m.createdAt, JSON.stringify(m.from), JSON.stringify(m.to), JSON.stringify(m.cc),
    m.envelopeFrom, JSON.stringify(m.envelopeTo), m.subject, m.html, m.text,
    JSON.stringify(m.headers), m.raw, m.raw.length,
    (m.text || m.html.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim().slice(0, 140),
    m.inbox,
  )
  const ins = db.prepare('INSERT INTO attachments VALUES (?,?,?,?,?,?,?)')
  m.attachments.forEach((a, i) => ins.run(m.id, i, a.filename, a.contentType, a.size, a.cid, a.content))
  // enforce retention
  db.prepare(`DELETE FROM messages WHERE id IN (SELECT id FROM messages ORDER BY created_at DESC LIMIT -1 OFFSET ?)`).run(config.maxMessages)
  db.exec('DELETE FROM attachments WHERE message_id NOT IN (SELECT id FROM messages)')
}

export function listMessages(opts: { q?: string; limit?: number; offset?: number; to?: string; subject?: string; inbox?: string } = {}) {
  const where: string[] = []
  const args: any[] = []
  if (opts.inbox) { where.push('m.inbox = ?'); args.push(opts.inbox) }
  if (opts.q) {
    where.push('(m.subject LIKE ? OR m.text LIKE ? OR m.from_json LIKE ? OR m.to_json LIKE ?)')
    const like = `%${opts.q}%`
    args.push(like, like, like, like)
  }
  if (opts.to) { where.push('(m.to_json LIKE ? OR m.envelope_to LIKE ?)'); args.push(`%${opts.to}%`, `%${opts.to}%`) }
  if (opts.subject) { where.push('m.subject LIKE ?'); args.push(`%${opts.subject}%`) }
  const w = where.length ? `WHERE ${where.join(' AND ')}` : ''
  const total = (db.prepare(`SELECT COUNT(*) c FROM messages m ${w}`).get(...args) as any).c as number
  const rows = db.prepare(`SELECT ${SUMMARY_COLS} FROM messages m ${w} ORDER BY m.created_at DESC LIMIT ? OFFSET ?`)
    .all(...args, opts.limit ?? 100, opts.offset ?? 0)
  const unread = (opts.inbox
    ? db.prepare('SELECT COUNT(*) c FROM messages WHERE read = 0 AND inbox = ?').get(opts.inbox)
    : db.prepare('SELECT COUNT(*) c FROM messages WHERE read = 0').get()) as any
  return { total, unread: unread.c as number, messages: rows.map(summary) }
}

export function listInboxes() {
  return db.prepare(`SELECT inbox AS name, COUNT(*) AS total, COALESCE(SUM(read = 0), 0) AS unread
    FROM messages WHERE inbox != '' GROUP BY inbox ORDER BY inbox`).all() as { name: string; total: number; unread: number }[]
}

export function getMessage(id: string): MessageFull | null {
  const r = db.prepare(`SELECT ${SUMMARY_COLS}, m.html, m.text, m.headers_json FROM messages m WHERE m.id = ?`).get(id) as any
  if (!r) return null
  return { ...summary(r), html: r.html || '', text: r.text || '', headers: j(r.headers_json) || {} }
}

export const getSummary = (id: string) => {
  const r = db.prepare(`SELECT ${SUMMARY_COLS} FROM messages m WHERE m.id = ?`).get(id)
  return r ? summary(r) : null
}

export const getRaw = (id: string) => (db.prepare('SELECT raw FROM messages WHERE id = ?').get(id) as any)?.raw as Uint8Array | undefined
export const markRead = (id: string, read = true) => db.prepare('UPDATE messages SET read = ? WHERE id = ?').run(read ? 1 : 0, id)
export const deleteMessage = (id: string) => {
  db.prepare('DELETE FROM attachments WHERE message_id = ?').run(id)
  return Number(db.prepare('DELETE FROM messages WHERE id = ?').run(id).changes) > 0
}
export const clearMessages = (inbox?: string) => {
  if (!inbox) return void db.exec('DELETE FROM attachments; DELETE FROM messages;')
  db.prepare('DELETE FROM attachments WHERE message_id IN (SELECT id FROM messages WHERE inbox = ?)').run(inbox)
  db.prepare('DELETE FROM messages WHERE inbox = ?').run(inbox)
}

export function listAttachments(id: string) {
  return db.prepare('SELECT idx, filename, content_type AS contentType, size, cid FROM attachments WHERE message_id = ? ORDER BY idx').all(id) as
    { idx: number; filename: string; contentType: string; size: number; cid: string }[]
}
export const getAttachment = (id: string, idx: number) =>
  db.prepare('SELECT filename, content_type AS contentType, content FROM attachments WHERE message_id = ? AND idx = ?').get(id, idx) as
    { filename: string; contentType: string; content: Uint8Array } | undefined
export const getAttachmentByCid = (id: string, cid: string) =>
  db.prepare('SELECT filename, content_type AS contentType, content FROM attachments WHERE message_id = ? AND cid = ?').get(id, cid) as
    { filename: string; contentType: string; content: Uint8Array } | undefined

export const listWebhooks = () => db.prepare('SELECT id, url FROM webhooks').all() as { id: string; url: string }[]
export const addWebhook = (id: string, url: string) => db.prepare('INSERT INTO webhooks VALUES (?,?)').run(id, url)
export const removeWebhook = (id: string) => Number(db.prepare('DELETE FROM webhooks WHERE id = ?').run(id).changes) > 0
