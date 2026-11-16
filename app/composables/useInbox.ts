export interface Address { name: string; address: string }
export interface Summary {
  id: string; createdAt: number; from: Address | null; to: Address[]; cc: Address[]; envelopeTo: string[]
  subject: string; size: number; read: boolean; attachmentCount: number; snippet: string; inbox: string
}
export interface InboxInfo { name: string; total: number; unread: number }
export interface Detail extends Summary {
  html: string; text: string; headers: Record<string, string>
  attachments: { idx: number; filename: string; contentType: string; size: number; cid: string }[]
  checks: { level: 'error' | 'warn' | 'info'; rule: string; message: string }[]
}

export const fmtAddr = (a?: Address | null) => (a ? (a.name ? `${a.name} <${a.address}>` : a.address) : 'unknown')
export const fmtSize = (n: number) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : n > 1024 ? `${(n / 1024).toFixed(1)} KB` : `${n} B`)
export const fmtTime = (t: number) => {
  const d = new Date(t)
  return Date.now() - t < 86400000 ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export function useInbox() {
  const messages = useState<Summary[]>('messages', () => [])
  const unread = useState('unread', () => 0)
  const total = useState('total', () => 0)
  const connected = useState('connected', () => false)
  const q = useState('q', () => '')
  // '' shows every message. A name shows, and clears, only that inbox.
  const inbox = useState('inbox', () => '')
  const inboxes = useState<InboxInfo[]>('inboxes', () => [])
  const selectedId = useState<string | null>('sel', () => null)
  const config = useState<{ smtpPort: number; persistent: boolean; relayEnabled: boolean; maxMessages: number; version: string } | null>('cfg', () => null)
  let es: EventSource | null = null

  async function refresh() {
    const [r, boxes] = await Promise.all([
      $fetch<{ total: number; unread: number; messages: Summary[] }>('/api/messages', { query: { q: q.value || undefined, inbox: inbox.value || undefined } }),
      $fetch<InboxInfo[]>('/api/inboxes'),
    ])
    messages.value = r.messages; unread.value = r.unread; total.value = r.total
    inboxes.value = boxes
    // The selected inbox was emptied, so fall back to showing everything.
    if (inbox.value && !boxes.some(b => b.name === inbox.value)) inbox.value = '' // the watcher in app.vue reloads the list
  }

  function connect() {
    if (es) return
    $fetch<typeof config.value>('/api/config').then(c => (config.value = c))
    refresh()
    es = new EventSource('/api/events')
    es.onopen = () => (connected.value = true)
    es.onerror = () => (connected.value = false)
    es.addEventListener('message', (e) => {
      const m = JSON.parse((e as MessageEvent).data) as Summary
      const shown = !inbox.value || m.inbox === inbox.value
      if (shown && !messages.value.some(x => x.id === m.id)) { messages.value = [m, ...messages.value]; total.value++; unread.value++ }
      if (m.inbox) {
        const box = inboxes.value.find(b => b.name === m.inbox)
        if (box) { box.total++; box.unread++ } else inboxes.value = [...inboxes.value, { name: m.inbox, total: 1, unread: 1 }].sort((a, b) => a.name.localeCompare(b.name))
      }
      if (!document.hasFocus() && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(m.subject, { body: `From ${fmtAddr(m.from)}` })
      }
    })
    es.addEventListener('cleared', (e) => {
      const cleared = (JSON.parse((e as MessageEvent).data || '{}') as { inbox?: string }).inbox
      if (!cleared) { messages.value = []; total.value = 0; unread.value = 0; selectedId.value = null; inboxes.value = []; inbox.value = ''; return }
      // Only one inbox was cleared. Drop the open message if it was in it, then reload the list.
      if (messages.value.some(m => m.id === selectedId.value && m.inbox === cleared)) selectedId.value = null
      refresh()
    })
  }

  async function remove(id: string) {
    await $fetch(`/api/messages/${id}`, { method: 'DELETE' })
    if (selectedId.value === id) selectedId.value = null
    await refresh()
  }
  async function clear() { await $fetch('/api/messages', { method: 'DELETE', query: { inbox: inbox.value || undefined } }) }

  return { messages, unread, total, connected, q, inbox, inboxes, selectedId, config, refresh, connect, remove, clear }
}
