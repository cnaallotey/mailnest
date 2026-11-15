<script setup lang="ts">
defineEmits<{ close: [] }>()
const { config } = useInbox()
const hooks = ref<{ id: string; url: string }[]>([])
const url = ref('')
const err = ref('')
const load = async () => (hooks.value = await $fetch('/api/webhooks'))
onMounted(load)
async function add() {
  err.value = ''
  try { await $fetch('/api/webhooks', { method: 'POST', body: { url: url.value } }); url.value = ''; await load() }
  catch (e: any) { err.value = e?.data?.statusMessage || 'Could not add webhook' }
}
async function del(id: string) { await $fetch(`/api/webhooks/${id}`, { method: 'DELETE' }); await load() }
</script>

<template>
  <div class="modal" @click.self="$emit('close')">
    <div>
      <h3 style="margin:0">Settings</h3>
      <table class="kv">
        <tbody>
          <tr><td>SMTP port</td><td>{{ config?.smtpPort }}</td></tr>
          <tr><td>Storage</td><td>{{ config?.persistent ? 'Persistent (SQLite file)' : 'In memory, cleared on restart' }}</td></tr>
          <tr><td>Retention</td><td>Last {{ config?.maxMessages }} messages</td></tr>
          <tr><td>Relay</td><td>{{ config?.relayEnabled ? 'Configured' : 'Off. Set --relay smtp://user:pass@host:587' }}</td></tr>
        </tbody>
      </table>
      <strong>Webhooks</strong>
      <div class="hint">Receives a JSON POST for every captured message.</div>
      <div v-for="h in hooks" :key="h.id" class="actions" style="justify-content:space-between"><code class="inline">{{ h.url }}</code><button class="danger" @click="del(h.id)">Remove</button></div>
      <div class="actions"><input v-model="url" placeholder="https://example.com/hook" @keyup.enter="add"><button class="primary" @click="add">Add</button></div>
      <div v-if="err" class="status-bad">{{ err }}</div>
      <div class="actions"><button @click="$emit('close')">Close</button></div>
    </div>
  </div>
</template>
