// Tiny test helper: import { Mailnest } from 'mailnest/client'

const normalizeInbox = (s) => String(s ?? '').trim().toLowerCase().replace(/[^a-z0-9._-]/g, '-').slice(0, 64)

// Adds link() and code() to a message without changing its JSON shape.
function decorate(m) {
  const find = (list, match) => {
    if (match === undefined) return list[0]
    return list.find(x => (match instanceof RegExp ? match.test(x) : x.includes(String(match))))
  }
  Object.defineProperties(m, {
    link: { value: match => find(m.links ?? [], match) },
    code: { value: match => find(m.codes ?? [], match) },
  })
  return m
}

export class Mailnest {
  /** @param {string | { baseUrl?: string, inbox?: string }} [options] */
  constructor(options = {}) {
    const o = typeof options === 'string' ? { baseUrl: options } : options
    this.base = (o.baseUrl ?? 'http://127.0.0.1:1080').replace(/\/$/, '')
    this.inboxName = o.inbox ? normalizeInbox(o.inbox) : ''
  }
  async #json(path, init) {
    const r = await fetch(this.base + path, init)
    if (!r.ok) throw new Error(`Mailnest ${r.status}: ${await r.text()}`)
    return r.json()
  }
  #query(params = {}) {
    const q = new URLSearchParams(params)
    if (this.inboxName) q.set('inbox', this.inboxName)
    const s = q.toString()
    return s ? `?${s}` : ''
  }
  /** A client scoped to one named inbox. Its list, wait and clear calls only touch that inbox. */
  inbox(name) { return new Mailnest({ baseUrl: this.base, inbox: name }) }
  /** Adds this inbox as a plus tag, so mail sent to the result is routed here: ama@user.test -> ama+worker-1@user.test */
  address(email) {
    if (!this.inboxName) return email
    const at = email.lastIndexOf('@')
    return `${email.slice(0, at).split('+')[0]}+${this.inboxName}${email.slice(at)}`
  }
  list(query = {}) { return this.#json('/api/messages' + this.#query(query)) }
  get(id) { return this.#json(`/api/messages/${id}`).then(decorate) }
  /** Deletes every message, or only this inbox's messages on a scoped client. */
  clear() { return this.#json('/api/messages' + this.#query(), { method: 'DELETE' }) }
  /** Resolves when a matching message arrives (or already exists). Rejects on timeout. */
  waitForEmail({ to, subject, timeout = 10000, since } = {}) {
    const q = { timeout: String(timeout) }
    if (to) q.to = to
    if (subject) q.subject = subject
    if (since) q.since = String(since)
    return this.#json('/api/messages/wait' + this.#query(q)).then(m => this.get(m.id))
  }
}
