<script setup lang="ts">
import type { Detail } from '~/composables/useInbox'
const props = defineProps<{ id: string }>()
const { refresh, remove, selectedId, config } = useInbox()
const msg = ref<Detail | null>(null)
const TABS = { html: 'HTML', text: 'Text', source: 'Source', headers: 'Headers', checks: 'Checks', clients: 'Clients', links: 'Links' } as const
type Tab = keyof typeof TABS
const tab = ref<Tab>('html')
const device = ref<'mobile' | 'tablet' | 'desktop'>('desktop')
const widths = { mobile: '375px', tablet: '768px', desktop: '100%' }
// light: as sent. dark: the email's own dark mode styles. invert: clients that recolour every email.
const scheme = ref<'light' | 'dark' | 'invert'>('light')
const hasDarkStyles = computed(() => /prefers-color-scheme\s*:\s*dark/i.test(msg.value?.html ?? ''))
const previewSrc = computed(() => `/api/messages/${props.id}/html${scheme.value === 'light' ? '' : `?scheme=${scheme.value}`}`)
interface CompatClient { family: string; name: string; major: boolean; platforms: string[]; notes: string[] }
interface CompatFeature { slug: string; title: string; category: string; url: string; level: 'error' | 'warn' | 'info'; unsupported: CompatClient[]; partial: CompatClient[] }
interface Compat { updated: string; counts: { error: number; warn: number; info: number }; clients: { family: string; name: string; major: boolean; unsupported: number; partial: number }[]; features: CompatFeature[] }
const compat = ref<Compat | null>(null)
const showMinor = ref(false)
const compatShown = computed(() => compat.value?.features.filter(f => showMinor.value || f.level !== 'info') ?? [])
const fmtClient = (c: CompatClient) => `${c.name} (${c.platforms.join(', ')})`
// Major clients are spelled out. Smaller ones are counted, with the full list in the tooltip.
const majorList = (cs: CompatClient[]) => cs.filter(c => c.major).map(fmtClient).join(', ')
const minorList = (cs: CompatClient[]) => cs.filter(c => !c.major).map(fmtClient).join(', ')
const minorCount = (cs: CompatClient[]) => cs.filter(c => !c.major).length
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
  if (t === 'clients' && !compat.value) compat.value = await $fetch<Compat>(`/api/messages/${props.id}/compat`)
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
      <button v-for="(label, t) in TABS" :key="t" class="tab" :class="{ active: tab === t }" @click="tab = t">
        {{ label }}<span v-if="t === 'checks' && worst" class="badge" style="margin-left:6px">{{ worst }}</span>
      </button>
      <span class="spacer" />
      <span v-if="tab === 'html'" class="devices actions">
        <button v-for="s in (['light', 'dark', 'invert'] as const)" :key="s" :class="{ active: scheme === s }"
                :title="s === 'light' ? 'As sent' : s === 'dark' ? 'With the email\'s own dark mode styles' : 'Approximates clients that recolour every email'" @click="scheme = s">{{ s === 'invert' ? 'inverted' : s }}</button>
        <span class="sep" />
        <button v-for="d in (['mobile', 'tablet', 'desktop'] as const)" :key="d" :class="{ active: device === d }" @click="device = d">{{ d }}</button>
      </span>
    </div>

    <div v-if="tab === 'html' && scheme !== 'light'" class="note">
      <template v-if="scheme === 'dark' && !hasDarkStyles">This email has no dark mode styles, so Apple Mail shows it unchanged. Try <b>inverted</b> to see what Gmail and Outlook may do to it.</template>
      <template v-else-if="scheme === 'dark'">Showing the email's own <code class="inline">prefers-color-scheme: dark</code> styles, as Apple Mail does.</template>
      <template v-else>An approximation of clients that recolour every email, such as Gmail on phones and Outlook on Windows. Real results vary by client.</template>
    </div>
    <div v-if="tab === 'html'" class="frame-wrap">
      <iframe class="preview" sandbox="allow-same-origin allow-popups" :src="previewSrc" :style="{ width: widths[device] }" title="Email preview" />
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
      <div v-else-if="tab === 'clients'">
        <div v-if="!compat" class="hint">Checking client support...</div>
        <template v-else>
          <div v-if="!compat.features.length" class="status-ok">Nothing in this email is known to be unsupported by any tested client.</div>
          <template v-else>
            <div class="clients">
              <span v-for="c in compat.clients.filter(c => c.major)" :key="c.family" class="client" :class="{ bad: c.unsupported }">
                <b>{{ c.name }}</b> {{ c.unsupported ? `${c.unsupported} unsupported` : `${c.partial} partial` }}
              </span>
            </div>
            <div v-if="!compatShown.length" class="status-ok" style="padding:8px 0">No problems in Gmail, Apple Mail, Outlook, Yahoo or Samsung Email.</div>
            <div v-for="f in compatShown" :key="f.slug" class="chk">
              <span class="lvl" :class="f.level">{{ f.level === 'error' ? 'unsupported' : f.level === 'warn' ? 'partial' : 'minor' }}</span>
              <div>
                <a :href="f.url" target="_blank" rel="noopener"><code class="inline">{{ f.title }}</code></a>
                <div v-for="g in ([['Not supported', f.unsupported], ['Partial', f.partial]] as const)" v-show="g[1].length" :key="g[0]" class="hint">
                  {{ g[0] }}: {{ majorList(g[1]) }}<span v-if="minorCount(g[1])" :title="minorList(g[1])" class="more">{{ majorList(g[1]) ? ' and ' : '' }}{{ minorCount(g[1]) }} smaller client{{ minorCount(g[1]) === 1 ? '' : 's' }}</span>
                </div>
              </div>
            </div>
            <div class="actions" style="margin-top:12px; align-items:center">
              <button v-if="compat.counts.info" @click="showMinor = !showMinor">{{ showMinor ? 'Hide' : 'Show' }} {{ compat.counts.info }} that only affect smaller clients</button>
              <span class="hint">Support data from <a href="https://www.caniemail.com" target="_blank" rel="noopener">Can I email</a>, updated {{ compat.updated }}.</span>
            </div>
          </template>
        </template>
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
