<script setup lang="ts">
import type { Detail } from '~/composables/useInbox'
const props = defineProps<{ id: string }>()
const { refresh, remove, selectedId, config } = useInbox()
const msg = ref<Detail | null>(null)
const tab = ref<'html' | 'text' | 'source' | 'headers' | 'checks' | 'links'>('html')
const device = ref<'mobile' | 'tablet' | 'desktop'>('desktop')
const widths = { mobile: '375px', tablet: '768px', desktop: '100%' }
const links = ref<{ url: string; status: number | null; ok: boolean; error?: string }[] | null>(null)
const checking = ref(false)
const source = ref('')
const releaseOpen = ref(false)
const releaseTo = ref('')
const releaseMsg = ref('')

onMounted(async () => {
  msg.value = await $fetch<Detail>(`/api/messages/${props.id}`)
  refresh()
})

watch(tab, async (t) => {
  if (t === 'source' && !source.value) source.value = await $fetch<string>(`/api/messages/${props.id}/raw`, { responseType: 'text' })
  if (t === 'links' && !links.value && !checking.value) {
    checking.value = true
    links.value = await $fetch(`/api/messages/${props.id}/links`).finally(() => (checking.value = false))
  }
})

async function markUnread() {
  await $fetch(`/api/messages/${props.id}/read`, { method: 'POST', body: { read: false } })
  await refresh(); selectedId.value = null
}
async function release() {
  releaseMsg.value = ''
  try {
    const r = await $fetch<{ accepted: string[] }>(`/api/messages/${props.id}/release`, { method: 'POST', body: { to: releaseTo.value.split(/[,\s]+/).filter(Boolean) } })
    releaseMsg.value = `Sent to ${r.accepted.join(', ')}`
  } catch (e: any) { releaseMsg.value = e?.data?.statusMessage || 'Release failed' }
}
const worst = computed(() => msg.value?.checks.filter(c => c.level !== 'info').length ?? 0)
</script>

<template>
  <template v-if="msg">
    <div class="msg-head">
      <div class="actions">
        <button @click="selectedId = null">Back</button>
        <span class="spacer" />
        <a :href="`/api/messages/${id}/raw?download=1`"><button>Download .eml</button></a>
        <button v-if="config?.relayEnabled" @click="releaseOpen = true">Release</button>
        <button @click="markUnread">Mark unread</button>
        <button class="danger" @click="remove(id)">Delete</button>
      </div>
      <h2>{{ msg.subject }}</h2>
      <div class="meta"><b>From</b> {{ fmtAddr(msg.from) }}</div>
      <div class="meta"><b>To</b> {{ msg.to.map(fmtAddr).join(', ') || msg.envelopeTo.join(', ') }}<span v-if="msg.cc.length"> &nbsp;<b>Cc</b> {{ msg.cc.map(fmtAddr).join(', ') }}</span></div>
      <div v-if="msg.attachments.length">
        <a v-for="a in msg.attachments" :key="a.idx" class="att" :href="`/api/messages/${id}/attachments/${a.idx}`">{{ a.filename }} <span class="hint">{{ fmtSize(a.size) }}</span></a>
      </div>
    </div>

    <div class="tabs">
      <button v-for="t in (['html', 'text', 'source', 'headers', 'checks', 'links'] as const)" :key="t" class="tab" :class="{ active: tab === t }" @click="tab = t">
        {{ t === 'html' ? 'HTML' : t[0].toUpperCase() + t.slice(1) }}<span v-if="t === 'checks' && worst" class="badge" style="margin-left:6px">{{ worst }}</span>
      </button>
      <span class="spacer" />
      <span v-if="tab === 'html'" class="devices actions">
        <button v-for="d in (['mobile', 'tablet', 'desktop'] as const)" :key="d" :class="{ active: device === d }" @click="device = d">{{ d }}</button>
      </span>
    </div>

    <div v-if="tab === 'html'" class="frame-wrap">
      <iframe class="preview" sandbox="allow-same-origin allow-popups" :src="`/api/messages/${id}/html`" :style="{ width: widths[device] }" title="Email preview" />
    </div>
    <div v-else class="pane">
      <pre v-if="tab === 'text'" class="src">{{ msg.text || '(no plain text part)' }}</pre>
      <pre v-else-if="tab === 'source'" class="src">{{ source || 'Loading...' }}</pre>
      <table v-else-if="tab === 'headers'" class="kv">
        <tbody>
          <tr v-for="(v, k) in msg.headers" :key="k"><td>{{ k }}</td><td>{{ v }}</td></tr>
        </tbody>
      </table>
      <div v-else-if="tab === 'checks'">
        <div v-if="!msg.checks.length" class="status-ok">No issues found.</div>
        <div v-for="c in msg.checks" :key="c.rule" class="chk"><span class="lvl" :class="c.level">{{ c.level }}</span><span>{{ c.message }}</span></div>
      </div>
      <div v-else-if="tab === 'links'">
        <div v-if="checking" class="hint">Checking links...</div>
        <div v-else-if="links && !links.length" class="hint">No links found.</div>
        <table v-else class="kv">
          <tbody>
            <tr v-for="l in links" :key="l.url"><td :class="l.ok ? 'status-ok' : 'status-bad'">{{ l.status ?? 'ERR' }}</td><td style="word-break:break-all">{{ l.url }}<div v-if="l.error" class="hint">{{ l.error }}</div></td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="releaseOpen" class="modal" @click.self="releaseOpen = false">
      <div>
        <h3 style="margin:0">Release message</h3>
        <p class="hint">Sends the original message through your configured relay server.</p>
        <input v-model="releaseTo" placeholder="you@example.com, other@example.com">
        <div v-if="releaseMsg" class="hint">{{ releaseMsg }}</div>
        <div class="actions"><button class="primary" @click="release">Send</button><button @click="releaseOpen = false">Close</button></div>
      </div>
    </div>
  </template>
</template>
