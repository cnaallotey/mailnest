export interface Address { name: string; address: string }
export interface Summary {
  id: string; createdAt: number; from: Address | null; to: Address[]; cc: Address[]; envelopeTo: string[]
  subject: string; size: number; read: boolean; attachmentCount: number; snippet: string
}
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
  const selectedId = useState<string | null>('sel', () => null)
  const config = useState<{ smtpPort: number; persistent: boolean; relayEnabled: boolean; maxMessages: number; version: string } | null>('cfg', () => null)
  let es: EventSource | null = null

  async function refresh() {
    const r = await $fetch<{ total: number; unread: number; messages: Summary[] }>('/api/messages', { query: { q: q.value || undefined } })
    messages.value = r.messages; unread.value = r.unread; total.value = r.total
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
      if (!messages.value.some(x => x.id === m.id)) { messages.value = [m, ...messages.value]; total.value++; unread.value++ }
      if (!document.hasFocus() && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(m.subject, { body: `From ${fmtAddr(m.from)}` })
      }
    })
    es.addEventListener('cleared', () => { messages.value = []; total.value = 0; unread.value = 0; selectedId.value = null })
  }

  async function remove(id: string) {
    await $fetch(`/api/messages/${id}`, { method: 'DELETE' })
    if (selectedId.value === id) selectedId.value = null
    await refresh()
  }
  async function clear() { await $fetch('/api/messages', { method: 'DELETE' }) }

  return { messages, unread, total, connected, q, selectedId, config, refresh, connect, remove, clear }
}
