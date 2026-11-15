<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import { withBase } from 'vitepress'

const repo = 'https://github.com/cnaallotey/mailnest'

// ---- install command copy ----
const copied = ref(false)
async function copy() {
  try {
    await navigator.clipboard.writeText('npx mailnest')
    copied.value = true
    setTimeout(() => (copied.value = false), 1600)
  } catch {}
}

// ---- inbox mock ----
interface Mail { id: number; from: string; subject: string; snippet: string; time: string; unread: boolean; checks: { level: 'error' | 'warn' | 'info'; text: string }[] }
const incoming: Mail = {
  id: 4, from: 'Acme', subject: 'Verify your email', snippet: 'Your code is 482913. It expires in 10 minutes.', time: 'now', unread: true,
  checks: [
    { level: 'warn', text: '1 image(s) missing alt text.' },
    { level: 'warn', text: 'Uses flex or grid. Outlook desktop and some clients do not support them, use tables.' },
    { level: 'info', text: 'No viewport meta tag. Mobile rendering may be scaled.' },
  ],
}
const mails = ref<Mail[]>([
  { id: 3, from: 'Acme Billing', subject: 'Your receipt #1042', snippet: 'Thanks for your order. Here is your receipt.', time: '2m', unread: false,
    checks: [{ level: 'error', text: 'Image uses a relative URL. It will not load in a real inbox.' }, { level: 'info', text: 'No unsubscribe link found. Required for marketing mail.' }] },
  { id: 2, from: 'Acme', subject: 'Reset your password', snippet: 'Someone asked to reset the password for…', time: '6m', unread: false,
    checks: [{ level: 'warn', text: 'Contains an empty or "#" link.' }] },
  { id: 1, from: 'Acme', subject: 'Welcome aboard, Ama', snippet: 'Thanks for joining. Here is how to get…', time: '9m', unread: false, checks: [] },
])
const selectedId = ref(3)
const tab = ref<'html' | 'checks'>('html')
const selected = computed(() => mails.value.find(m => m.id === selectedId.value)!)

function select(id: number) {
  selectedId.value = id
  const m = mails.value.find(x => x.id === id)
  if (m) m.unread = false
}

let timer: ReturnType<typeof setTimeout> | undefined
onMounted(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  timer = setTimeout(() => {
    mails.value.unshift(incoming)
  }, reduce ? 0 : 1800)
})
onBeforeUnmount(() => clearTimeout(timer))

const features = [
  { title: 'Device preview', body: 'Flip the HTML view between mobile, tablet and desktop widths. Rendered in a sandbox with scripts blocked.' },
  { title: 'Link checker', body: 'Requests every link in a message and shows the status code, so dead links never reach a customer.' },
  { title: 'Inline images', body: 'cid: images render in place, and every attachment is one click from download.' },
  { title: 'REST API and webhooks', body: 'List, search, wait for and delete messages over HTTP. Get a JSON POST for every capture.' },
  { title: 'Release', body: 'Forward a captured message through a real SMTP server to see it in Gmail or Outlook.' },
  { title: 'Keep it or bin it', body: 'In memory by default. Add --db mail.db to keep messages across restarts in SQLite.' },
]
const stacks = ['Node.js', 'Laravel', 'Rails', 'Django', 'Phoenix', 'Spring', 'Go', '.NET', 'Docker']
</script>

<template>
  <div class="mn">
    <!-- HERO -->
    <section class="hero wrap">
      <div class="hero-copy">
        <a class="eyebrow" :href="repo" target="_blank" rel="noopener">
          <span class="pill">Open source</span> MIT licensed, free forever →
        </a>
        <h1>Every email your app sends, <span class="accent">caught locally.</span></h1>
        <p class="lede">
          Mailnest is a local SMTP server with a live inbox. Point your app at
          <code>localhost:1025</code> and see each message the moment it is sent,
          with checks that flag what breaks in real inboxes.
        </p>
        <div class="install">
          <span class="prompt">$</span>
          <code>npx mailnest</code>
          <button class="copy" @click="copy" :aria-label="copied ? 'Copied' : 'Copy command'">{{ copied ? 'Copied' : 'Copy' }}</button>
        </div>
        <div class="ctas">
          <a class="btn primary" :href="withBase('/guide/getting-started')">Get started</a>
          <a class="btn" :href="repo" target="_blank" rel="noopener">
            <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"/></svg>
            View on GitHub
          </a>
        </div>
        <p class="req">Requires Node 22.13 or newer. No account, no config file.</p>
      </div>

      <!-- Inbox mock -->
      <div class="mock" role="img" aria-label="The Mailnest inbox showing captured emails and a checks panel">
        <div class="chrome">
          <span class="dots"><i /><i /><i /></span>
          <span class="url">127.0.0.1:1080</span>
        </div>
        <div class="app">
          <aside class="side">
            <div class="side-head">
              <b>Mailnest</b>
              <span class="live"><span class="dot" />live</span>
            </div>
            <div class="search">Search mail</div>
            <TransitionGroup name="slide" tag="ul" class="list">
              <li v-for="m in mails" :key="m.id" :class="{ active: m.id === selectedId, unread: m.unread }" @click="select(m.id)">
                <div class="row"><span class="from">{{ m.from }}</span><span class="time">{{ m.time }}</span></div>
                <div class="subj">{{ m.subject }}</div>
                <div class="snip">{{ m.snippet }}</div>
              </li>
            </TransitionGroup>
          </aside>
          <div class="pane">
            <div class="msg-head">
              <div class="subject">{{ selected.subject }}</div>
              <div class="meta"><b>{{ selected.from }}</b> &lt;hello@acme.test&gt; to ama@user.test</div>
            </div>
            <div class="tabs">
              <button :class="{ on: tab === 'html' }" @click="tab = 'html'">HTML</button>
              <button disabled>Text</button>
              <button disabled>Source</button>
              <button :class="{ on: tab === 'checks' }" @click="tab = 'checks'">
                Checks <span v-if="selected.checks.length" class="count">{{ selected.checks.length }}</span>
              </button>
            </div>
            <div v-if="tab === 'html'" class="preview">
              <div class="email">
                <div class="email-logo">acme</div>
                <div class="email-h">{{ selected.subject }}</div>
                <div class="email-p">{{ selected.snippet }}</div>
                <div class="email-btn">Open Acme</div>
                <div class="email-foot">You are receiving this because you signed up at acme.test</div>
              </div>
            </div>
            <ul v-else class="checks">
              <li v-if="!selected.checks.length" class="ok">No issues found.</li>
              <li v-for="c in selected.checks" :key="c.text"><span :class="['lvl', c.level]">{{ c.level }}</span>{{ c.text }}</li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- STEPS -->
    <section class="wrap steps">
      <div class="step"><span class="n">1</span><div><h3>Run it</h3><p><code>npx mailnest</code> starts SMTP on 1025 and the inbox on 1080.</p></div></div>
      <div class="step"><span class="n">2</span><div><h3>Point your app at it</h3><p>Set your SMTP host to <code>127.0.0.1</code> and port to <code>1025</code>. No TLS, no password.</p></div></div>
      <div class="step"><span class="n">3</span><div><h3>Watch mail arrive</h3><p>Open <code>127.0.0.1:1080</code>. New messages appear live, no refresh.</p></div></div>
    </section>

    <!-- CHECKS -->
    <section class="wrap split">
      <div>
        <p class="kicker">Email checks</p>
        <h2>Find out what Outlook will break before a customer does.</h2>
        <p>
          Every captured message runs through a set of checks for the things that quietly fail in
          real inboxes: relative image URLs, missing alt text, flex and grid layouts, linked stylesheets,
          scripts, missing plain text parts, and HTML big enough for Gmail to clip.
        </p>
        <a class="more" :href="withBase('/guide/checks')">See every check →</a>
      </div>
      <ul class="checks card">
        <li><span class="lvl error">error</span>Image uses a relative URL. It will not load in a real inbox.</li>
        <li><span class="lvl warn">warn</span>HTML is over 102KB. Gmail will clip the message.</li>
        <li><span class="lvl warn">warn</span>No plain text alternative. Some clients and spam filters expect one.</li>
        <li><span class="lvl warn">warn</span>Linked stylesheet. Most clients ignore it, inline your CSS.</li>
        <li><span class="lvl info">info</span>No unsubscribe link found. Required for marketing mail.</li>
      </ul>
    </section>

    <!-- TESTING -->
    <section class="wrap split reverse">
      <div>
        <p class="kicker">End to end tests</p>
        <h2>Assert on the email, not just the button click.</h2>
        <p>
          <code>waitForEmail</code> blocks until a matching message arrives, then hands you the parsed
          email. Pull the code out of a verification mail or follow a reset link, in Playwright, Vitest,
          Cypress tasks or plain <code>fetch</code>.
        </p>
        <a class="more" :href="withBase('/guide/testing')">Testing guide →</a>
      </div>
      <div class="code card">
        <div class="code-head">signup.spec.ts</div>
<pre><code><span class="k">import</span> { test, expect } <span class="k">from</span> <span class="s">'@playwright/test'</span>
<span class="k">import</span> { Mailnest } <span class="k">from</span> <span class="s">'mailnest/client'</span>

<span class="k">const</span> mail = <span class="k">new</span> <span class="f">Mailnest</span>()

<span class="f">test</span>(<span class="s">'new users get a code'</span>, <span class="k">async</span> ({ page }) => {
  <span class="k">await</span> mail.<span class="f">clear</span>()
  <span class="k">await</span> page.<span class="f">goto</span>(<span class="s">'/signup'</span>)
  <span class="k">await</span> page.<span class="f">fill</span>(<span class="s">'#email'</span>, <span class="s">'ama@user.test'</span>)
  <span class="k">await</span> page.<span class="f">click</span>(<span class="s">'text=Create account'</span>)

  <span class="k">const</span> email = <span class="k">await</span> mail.<span class="f">waitForEmail</span>({
    to: <span class="s">'ama@user.test'</span>, subject: <span class="s">'Verify'</span>,
  })
  <span class="k">const</span> code = email.text.<span class="f">match</span>(<span class="s">/\d{6}/</span>)[<span class="num">0</span>]
  <span class="f">expect</span>(code).<span class="f">toHaveLength</span>(<span class="num">6</span>)
})</code></pre>
      </div>
    </section>

    <!-- FEATURE GRID -->
    <section class="wrap">
      <p class="kicker center">Everything else</p>
      <h2 class="center">Small tool, no missing pieces.</h2>
      <div class="grid">
        <div v-for="f in features" :key="f.title" class="feat">
          <h3>{{ f.title }}</h3>
          <p>{{ f.body }}</p>
        </div>
      </div>
    </section>

    <!-- STACKS -->
    <section class="wrap stacks">
      <h2>Works with anything that speaks SMTP.</h2>
      <div class="chips"><span v-for="s in stacks" :key="s">{{ s }}</span></div>
      <a class="more" :href="withBase('/guide/connect-your-app')">Setup snippets for each →</a>
    </section>

    <!-- OPEN SOURCE -->
    <section class="wrap">
      <div class="oss">
        <div>
          <h2>Free and open source.</h2>
          <p>
            Mailnest is MIT licensed and built in the open. Read the code, file an issue, or send a
            pull request. Small focused changes are the easiest to review.
          </p>
        </div>
        <div class="oss-links">
          <a class="btn primary" :href="repo" target="_blank" rel="noopener">Star on GitHub</a>
          <a class="btn" :href="withBase('/guide/contributing')">Contributing guide</a>
          <a class="btn" :href="repo + '/issues'" target="_blank" rel="noopener">Report an issue</a>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.mn { --line: var(--vp-c-divider); --muted: var(--vp-c-text-2); --panel: var(--vp-c-bg-soft); padding-bottom: 96px; }
.wrap { max-width: 1152px; margin-left: auto; margin-right: auto; padding: 0 24px; }
.mn > section { margin-top: 112px; }
h1, h2, h3 { letter-spacing: -0.02em; color: var(--vp-c-text-1); }
h2 { font-size: clamp(26px, 3.4vw, 36px); line-height: 1.15; font-weight: 700; margin: 0 0 16px; max-width: 18ch; }
h3 { font-size: 16px; font-weight: 600; margin: 0 0 6px; }
p { color: var(--muted); line-height: 1.65; margin: 0; }
code { font-family: var(--vp-font-family-mono); font-size: 0.88em; background: var(--vp-c-default-soft); padding: 2px 6px; border-radius: 6px; color: var(--vp-c-text-1); }
.center { text-align: center; margin-left: auto; margin-right: auto; }
.kicker { font-size: 13px; font-weight: 600; color: var(--vp-c-brand-1); margin-bottom: 10px; }
.more { display: inline-block; margin-top: 20px; font-weight: 600; color: var(--vp-c-brand-1); text-decoration: none; }
.more:hover { text-decoration: underline; }
.card { border: 1px solid var(--line); border-radius: 14px; background: var(--vp-c-bg); }

/* hero */
.mn > .hero { margin-top: 56px; display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr); gap: 56px; align-items: center; }
.eyebrow { max-width: 100%; display: inline-flex; align-items: center; gap: 10px; font-size: 13px; color: var(--muted); text-decoration: none; border: 1px solid var(--line); border-radius: 999px; padding: 4px 12px 4px 4px; }
.eyebrow:hover { border-color: var(--vp-c-brand-2); color: var(--vp-c-text-1); }
.pill { white-space: nowrap; background: var(--vp-c-brand-soft); color: var(--vp-c-brand-1); border-radius: 999px; padding: 2px 10px; font-weight: 600; }
h1 { font-size: clamp(36px, 5.2vw, 56px); line-height: 1.05; font-weight: 800; margin: 22px 0 18px; }
.accent { color: var(--vp-c-brand-1); }
.lede { font-size: 18px; max-width: 46ch; }
.install { margin-top: 28px; display: flex; align-items: center; gap: 12px; max-width: 360px; border: 1px solid var(--line); background: var(--panel); border-radius: 12px; padding: 8px 8px 8px 16px; font-family: var(--vp-font-family-mono); }
.install code { background: none; padding: 0; font-size: 15px; flex: 1; }
.prompt { color: var(--vp-c-brand-1); }
.copy { font-size: 13px; font-weight: 600; border: 1px solid var(--line); border-radius: 8px; padding: 5px 12px; background: var(--vp-c-bg); color: var(--vp-c-text-1); }
.copy:hover { border-color: var(--vp-c-brand-2); }
.ctas { display: flex; gap: 12px; margin-top: 20px; flex-wrap: wrap; }
.btn { display: inline-flex; align-items: center; gap: 8px; font-weight: 600; font-size: 14px; border: 1px solid var(--line); border-radius: 10px; padding: 10px 18px; color: var(--vp-c-text-1); text-decoration: none; transition: border-color .15s, background .15s; }
.btn:hover { border-color: var(--vp-c-brand-2); }
.btn.primary { background: var(--vp-c-brand-3); border-color: var(--vp-c-brand-3); color: #fff; }
.btn.primary:hover { background: var(--vp-c-brand-1); border-color: var(--vp-c-brand-1); }
.req { font-size: 13px; margin-top: 16px; }

/* mock */
.mock { border: 1px solid var(--line); border-radius: 14px; overflow: hidden; background: var(--vp-c-bg); box-shadow: 0 1px 2px rgba(0,0,0,.04), 0 24px 60px -20px rgba(60, 40, 180, .28); font-size: 12.5px; }
.chrome { display: flex; align-items: center; gap: 12px; padding: 10px 14px; border-bottom: 1px solid var(--line); background: var(--panel); }
.dots { display: flex; gap: 6px; }
.dots i { width: 10px; height: 10px; border-radius: 50%; background: var(--vp-c-default-3); }
.url { font-family: var(--vp-font-family-mono); font-size: 11.5px; color: var(--muted); background: var(--vp-c-bg); border: 1px solid var(--line); border-radius: 6px; padding: 2px 10px; }
.app { display: grid; grid-template-columns: 210px 1fr; height: 380px; }
.side { border-right: 1px solid var(--line); display: flex; flex-direction: column; position: relative; min-width: 0; }
.side-head { display: flex; justify-content: space-between; align-items: center; padding: 12px 12px 8px; font-size: 13px; }
.live { color: var(--muted); font-size: 11px; display: flex; align-items: center; gap: 5px; }
.dot { width: 7px; height: 7px; border-radius: 50%; background: #16a34a; box-shadow: 0 0 0 3px rgba(22,163,74,.18); }
.search { margin: 0 12px 8px; border: 1px solid var(--line); border-radius: 7px; padding: 5px 9px; color: var(--muted); font-size: 11.5px; }
.list { list-style: none; margin: 0; padding: 0; overflow: hidden; }
.list li { margin: 0; padding: 9px 12px; border-top: 1px solid var(--line); cursor: pointer; display: grid; gap: 1px; min-width: 0; }
.list li:hover { background: var(--panel); }
.list li.active { background: var(--vp-c-brand-soft); }
.row { display: flex; justify-content: space-between; gap: 6px; }
.from { font-weight: 600; color: var(--vp-c-text-1); }
.time, .snip { color: var(--muted); font-size: 11px; }
.subj, .snip { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.subj { color: var(--vp-c-text-1); }
.list li.unread .subj, .list li.unread .from { font-weight: 700; }
.list li.unread { box-shadow: inset 3px 0 0 var(--vp-c-brand-3); }
.pane { display: flex; flex-direction: column; min-width: 0; }
.msg-head { padding: 12px 16px; border-bottom: 1px solid var(--line); }
.subject { font-size: 14.5px; font-weight: 700; color: var(--vp-c-text-1); }
.meta { color: var(--muted); font-size: 11.5px; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.meta b { color: var(--vp-c-text-1); font-weight: 600; }
.tabs { display: flex; gap: 2px; padding: 0 10px; border-bottom: 1px solid var(--line); }
.tabs button { font-size: 12px; padding: 8px 10px; color: var(--muted); border-bottom: 2px solid transparent; display: flex; align-items: center; gap: 5px; }
.tabs button:disabled { cursor: default; opacity: .7; }
.tabs button.on { color: var(--vp-c-text-1); border-bottom-color: var(--vp-c-brand-3); }
.count { background: #f59e0b; color: #fff; border-radius: 999px; font-size: 10px; font-weight: 700; padding: 0 6px; }
.preview { flex: 1; padding: 18px; background: repeating-conic-gradient(var(--vp-c-default-soft) 0 25%, transparent 0 50%) 50% / 16px 16px; overflow: hidden; }
.email { background: #fff; color: #1f2328; border-radius: 8px; padding: 20px; max-width: 320px; margin: 0 auto; box-shadow: 0 1px 3px rgba(0,0,0,.08); }
.email-logo { font-weight: 800; color: #6d5efc; letter-spacing: -0.02em; font-size: 15px; }
.email-h { font-size: 16px; font-weight: 700; margin: 14px 0 6px; }
.email-p { color: #57606a; line-height: 1.5; }
.email-btn { display: inline-block; background: #6d5efc; color: #fff; border-radius: 6px; padding: 7px 14px; margin-top: 14px; font-weight: 600; }
.email-foot { color: #8c959f; font-size: 10.5px; margin-top: 18px; border-top: 1px solid #eaeef2; padding-top: 10px; }

/* checks list */
.checks { list-style: none; margin: 0; padding: 4px 16px; }
.checks li { display: flex; gap: 10px; align-items: baseline; padding: 10px 0; border-bottom: 1px solid var(--line); color: var(--vp-c-text-1); line-height: 1.45; margin: 0; }
.checks li:last-child { border-bottom: 0; }
.checks.card { padding: 8px 20px; font-size: 14px; }
.checks .ok { color: #16a34a; }
.lvl { flex: none; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; border-radius: 5px; padding: 2px 6px; }
.lvl.error { background: rgba(220,38,38,.12); color: #dc2626; }
.lvl.warn { background: rgba(217,119,6,.14); color: #c2680a; }
.lvl.info { background: var(--vp-c-brand-soft); color: var(--vp-c-brand-1); }

/* steps */
.mn > .steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0; margin-top: 96px; max-width: 1104px; padding: 0; border: 1px solid var(--line); border-radius: 14px; }
.step { display: flex; gap: 14px; padding: 24px; }
.step + .step { border-left: 1px solid var(--line); }
.n { flex: none; width: 28px; height: 28px; border-radius: 8px; display: grid; place-items: center; background: var(--vp-c-brand-soft); color: var(--vp-c-brand-1); font-weight: 700; font-size: 14px; }
.step p { font-size: 14px; }

/* split sections */
.split { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr); gap: 64px; align-items: center; }
.split.reverse > :first-child { order: 2; }
.code { overflow: hidden; }
.code-head { font-size: 12px; color: var(--muted); padding: 10px 16px; border-bottom: 1px solid var(--line); font-family: var(--vp-font-family-mono); }
.code pre { margin: 0; padding: 16px; overflow-x: auto; font-size: 13px; line-height: 1.6; }
.code pre code { background: none; padding: 0; font-size: inherit; color: var(--vp-c-text-1); }
.k { color: #8250df; } .s { color: #0a7f4f; } .f { color: #0550ae; } .num { color: #b35900; }
.dark .k { color: #c4a7ff; } .dark .s { color: #7ee2a8; } .dark .f { color: #8cc8ff; } .dark .num { color: #ffb86b; }

/* grid */
.grid { margin-top: 40px; display: grid; grid-template-columns: repeat(3, 1fr); border-top: 1px solid var(--line); border-left: 1px solid var(--line); }
.feat { padding: 28px; border-right: 1px solid var(--line); border-bottom: 1px solid var(--line); }
.feat p { font-size: 14px; }

/* stacks */
.stacks { text-align: center; }
.stacks h2 { margin: 0 auto 24px; max-width: none; }
.chips { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; }
.chips span { border: 1px solid var(--line); border-radius: 999px; padding: 6px 16px; font-size: 14px; font-weight: 500; color: var(--vp-c-text-1); }

/* oss */
.oss { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr); gap: 40px; align-items: center; padding: 48px; border-radius: 18px; background: var(--vp-c-brand-soft); }
.oss h2 { margin-bottom: 12px; }
.oss-links { display: flex; flex-wrap: wrap; gap: 12px; justify-content: flex-end; }
.oss .btn:not(.primary) { background: var(--vp-c-bg); }

/* motion */
.slide-enter-active { transition: all .45s cubic-bezier(.2,.8,.2,1); }
.slide-enter-from { opacity: 0; transform: translateY(-12px); background: var(--vp-c-brand-soft); }
.slide-move { transition: transform .45s cubic-bezier(.2,.8,.2,1); }
@keyframes pop { from { opacity: 0; transform: translateY(6px); } }
@media (prefers-reduced-motion: reduce) {
  .slide-enter-active, .slide-move { transition: none; animation: none; }
}

/* responsive */
@media (max-width: 960px) {
  .mn > .hero, .split, .oss { grid-template-columns: minmax(0, 1fr); gap: 40px; }
  .split.reverse > :first-child { order: 0; }
  .grid { grid-template-columns: repeat(2, 1fr); }
  .oss-links { justify-content: flex-start; }
}
@media (max-width: 640px) {
  .wrap { padding: 0 16px; }
  .mn > section { margin-top: 80px; }
  .mn > .hero { margin-top: 32px; }
  .mn > .steps { grid-template-columns: 1fr; max-width: calc(100% - 32px); }
  .step + .step { border-left: 0; border-top: 1px solid var(--line); }
  .grid { grid-template-columns: 1fr; }
  .app { grid-template-columns: 1fr; height: auto; }
  .side { display: none; }
  .preview { min-height: 260px; }
  .oss { padding: 28px; }
}
</style>
