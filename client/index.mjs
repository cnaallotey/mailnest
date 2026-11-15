// Tiny test helper: import { Mailnest } from 'mailnest/client'
export class Mailnest {
  constructor(baseUrl = 'http://127.0.0.1:1080') { this.base = baseUrl.replace(/\/$/, '') }
  async #json(path, init) {
    const r = await fetch(this.base + path, init)
    if (!r.ok) throw new Error(`Mailnest ${r.status}: ${await r.text()}`)
    return r.json()
  }
  list(query = {}) { return this.#json('/api/messages?' + new URLSearchParams(query)) }
  get(id) { return this.#json(`/api/messages/${id}`) }
  clear() { return this.#json('/api/messages', { method: 'DELETE' }) }
  /** Resolves when a matching message arrives (or already exists). Rejects on timeout. */
  waitForEmail({ to, subject, timeout = 10000, since } = {}) {
    const q = new URLSearchParams({ timeout: String(timeout) })
    if (to) q.set('to', to)
    if (subject) q.set('subject', subject)
    if (since) q.set('since', String(since))
    return this.#json('/api/messages/wait?' + q).then(m => this.get(m.id))
  }
}
