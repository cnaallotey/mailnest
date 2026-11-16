<script setup lang="ts">
const { messages, unread, total, connected, q, inbox, inboxes, selectedId, config, refresh, connect, clear } = useInbox()
const showSettings = ref(false)
onMounted(connect)
let t: ReturnType<typeof setTimeout>
watch(q, () => { clearTimeout(t); t = setTimeout(refresh, 200) })
watch(inbox, () => { selectedId.value = null; refresh() })

function onKey(e: KeyboardEvent) {
  if ((e.target as HTMLElement)?.tagName === 'INPUT') return
  const i = messages.value.findIndex(m => m.id === selectedId.value)
  if (e.key === 'j') selectedId.value = messages.value[Math.min(i + 1, messages.value.length - 1)]?.id ?? null
  if (e.key === 'k') selectedId.value = messages.value[Math.max(i - 1, 0)]?.id ?? null
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))

async function askNotify() { if ('Notification' in window) await Notification.requestPermission() }
const smtp = computed(() => config.value?.smtpPort ?? 1025)
</script>

<template>
  <div class="app">
    <aside class="side" :class="{ 'hide-m': selectedId }">
      <header>
        <div class="brand">
          <span><span class="dot" :class="{ on: connected }" />Mailnest <small v-if="unread">&nbsp;<span class="badge">{{ unread }}</span></small></span>
          <span class="actions">
            <button title="Settings" @click="showSettings = true">Settings</button>
            <button class="danger" :disabled="!total" :title="inbox ? `Clear the ${inbox} inbox` : 'Clear all messages'" @click="clear">Clear</button>
          </span>
        </div>
        <input v-model="q" placeholder="Search subject, sender, body" aria-label="Search">
        <select v-if="inboxes.length" v-model="inbox" aria-label="Inbox">
          <option value="">All inboxes</option>
          <option v-for="b in inboxes" :key="b.name" :value="b.name">{{ b.name }} ({{ b.total }})</option>
        </select>
      </header>
      <div class="list">
        <div v-for="m in messages" :key="m.id" class="item" :class="{ active: m.id === selectedId, unread: !m.read }" @click="selectedId = m.id">
          <div class="row"><span class="from">{{ m.from?.name || m.from?.address || 'unknown' }}<span v-if="m.inbox && !inbox" class="tag">{{ m.inbox }}</span></span><span class="time">{{ fmtTime(m.createdAt) }}</span></div>
          <div class="subj">{{ m.subject }}<span v-if="m.attachmentCount" class="time"> &nbsp;{{ m.attachmentCount }} file(s)</span></div>
          <div class="snip">{{ m.snippet }}</div>
        </div>
        <div v-if="!messages.length" class="hint" style="padding:16px">{{ q ? 'No matches.' : 'Nothing here yet.' }}</div>
      </div>
    </aside>

    <main class="main" :class="{ 'hide-m': !selectedId }">
      <MessageView v-if="selectedId" :id="selectedId" :key="selectedId" />
      <div v-else class="empty">
        <h2>Point your app at Mailnest</h2>
        <p>Send any email to <code>localhost:{{ smtp }}</code> and it shows up here instantly. No auth or TLS needed.</p>
        <pre>SMTP_HOST=localhost
SMTP_PORT={{ smtp }}</pre>
        <p class="hint">Tip: j and k move between messages.</p>
        <button @click="askNotify">Enable desktop notifications</button>
      </div>
    </main>
    <SettingsPanel v-if="showSettings" @close="showSettings = false" />
  </div>
</template>
