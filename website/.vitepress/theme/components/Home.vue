<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, type Directive } from 'vue'
import { withBase } from 'vitepress'
import ShaderBg from './ShaderBg.vue'
import {
  siNodedotjs, siLaravel, siRubyonrails, siDjango, siPhoenixframework, siSpringboot, siGo, siDotnet,
  siDocker, siNestjs, siNextdotjs, siNuxt, siSymfony, siFastapi, siVitest, siJest, siCypress, siBun,
} from 'simple-icons'

const repo = 'https://github.com/cnaallotey/mailnest'

// Scroll reveal: elements start hidden only once JS runs, so the page still reads without it.
const vReveal: Directive<HTMLElement, number | undefined> = {
  mounted(el, { value }) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    el.classList.add('rv')
    if (value) el.style.transitionDelay = `${value}ms`
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { el.classList.add('in'); io.disconnect() }
    }, { rootMargin: '0px 0px -8% 0px' })
    io.observe(el)
  },
}

// Install command copy
const copied = ref(false)
async function copy() {
  try { await navigator.clipboard.writeText('npx mailnest'); copied.value = true; setTimeout(() => (copied.value = false), 1600) } catch {}
}

// Hero inbox mock
interface Mail { id: number; from: string; subject: string; snippet: string; time: string; unread: boolean; checks: { level: 'error' | 'warn' | 'info'; text: string }[] }
const incoming: Mail = {
  id: 4, from: 'Acme', subject: 'Verify your email', snippet: 'Your code is 482913. It expires in 10 minutes.', time: 'now', unread: true,
  checks: [
    { level: 'warn', text: '1 image(s) missing alt text.' },
    { level: 'warn', text: 'Uses flex or grid. Outlook desktop does not support them, use tables.' },
    { level: 'info', text: 'No viewport meta tag. Mobile rendering may be scaled.' },
  ],
}
const mails = ref<Mail[]>([
  { id: 3, from: 'Acme Billing', subject: 'Your receipt #1042', snippet: 'Thanks for your order. Here is your receipt.', time: '2m', unread: false,
    checks: [{ level: 'error', text: 'Image uses a relative URL. It will not load in a real inbox.' }, { level: 'info', text: 'No unsubscribe link found.' }] },
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

// 3D tilt on the hero card, following the pointer
const tilt = ref({ x: 0, y: 0 })
function onTilt(e: PointerEvent) {
  const b = (e.currentTarget as HTMLElement).getBoundingClientRect()
  tilt.value = { x: ((e.clientY - b.top) / b.height - .5) * -5, y: ((e.clientX - b.left) / b.width - .5) * 7 }
}
const resetTilt = () => (tilt.value = { x: 0, y: 0 })

let timer: ReturnType<typeof setTimeout> | undefined
onMounted(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  timer = setTimeout(() => mails.value.unshift(incoming), reduce ? 0 : 1600)
})
onBeforeUnmount(() => clearTimeout(timer))

// Brand marks from simple-icons (CC0). Very dark brand colours fall back to the text colour on hover
// so they stay visible in dark mode.
const icons = [siNodedotjs, siLaravel, siRubyonrails, siDjango, siPhoenixframework, siSpringboot, siGo, siDotnet,
  siDocker, siNestjs, siNextdotjs, siNuxt, siSymfony, siFastapi, siVitest, siJest, siCypress, siBun]
const lum = (hex: string) => {
  const n = parseInt(hex, 16)
  return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255
}
const stacks = icons.map(i => ({ title: i.title, path: i.path, color: lum(i.hex) < 0.25 ? 'var(--vp-c-text-1)' : `#${i.hex}` }))
const marquee = [...stacks, ...stacks]
</script>

<template>
  <div class="mn">
    <!-- HERO -->
    <section class="hero">
      <div class="hero-copy">
        <p class="eyebrow" v-reveal>Open source email testing</p>
        <h1 v-reveal="80">Send the email.<br><span class="accent">See it instantly.</span></h1>
        <p class="lede" v-reveal="160">
          Mailnest is a local SMTP server with a live inbox. Point your app at
          <code>localhost:1025</code> and every message lands in front of you, checked for what
          breaks in real inboxes.
        </p>
        <div class="ctas" v-reveal="240">
          <a class="btn dark" :href="withBase('/guide/getting-started')">Get started <span class="arr">→</span></a>
          <a class="link" :href="repo" target="_blank" rel="noopener">View on GitHub <span class="arr">→</span></a>
        </div>
        <button class="install" v-reveal="320" @click="copy" :aria-label="copied ? 'Copied' : 'Copy npx mailnest'">
          <span class="prompt">$</span><code>npx mailnest</code>
          <span class="copy">{{ copied ? 'Copied' : 'Copy' }}</span>
        </button>
        <p class="fine" v-reveal="380">MIT licensed. Node 22.13 or newer. No account, no config file.</p>
      </div>

      <div class="hero-stage" @pointermove="onTilt" @pointerleave="resetTilt">
        <ShaderBg />
        <div class="mock" :style="{ transform: `perspective(1400px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }"
             role="img" aria-label="The Mailnest inbox showing captured emails">
          <div class="mock-top">
            <span><b>Mailnest</b><span class="crumb"> / Inbox</span></span>
            <span class="live"><span class="dot" />Listening on :1025</span>
          </div>
          <div class="app">
            <aside class="side">
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
              <Transition name="fade" mode="out-in">
                <div v-if="tab === 'html'" :key="'h' + selected.id" class="preview">
                  <div class="email">
                    <div class="email-logo">acme</div>
                    <div class="email-h">{{ selected.subject }}</div>
                    <div class="email-p">{{ selected.snippet }}</div>
                    <div class="email-btn">Open Acme</div>
                  </div>
                </div>
                <ul v-else :key="'c' + selected.id" class="checks">
                  <li v-if="!selected.checks.length" class="ok">No issues found.</li>
                  <li v-for="c in selected.checks" :key="c.text"><span :class="['lvl', c.level]">{{ c.level }}</span>{{ c.text }}</li>
                </ul>
              </Transition>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- MARQUEE -->
    <section class="marquee-wrap">
      <p class="center small" v-reveal>Works with the stack you already have</p>
      <div class="marquee" v-reveal="80">
        <div class="track">
          <span v-for="(s, i) in marquee" :key="i" class="logo" :title="s.title" :style="{ '--brand': s.color }"
                :aria-hidden="i >= stacks.length">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path :d="s.path" /></svg><span class="sr">{{ s.title }}</span>
          </span>
        </div>
      </div>
    </section>

    <!-- HOW IT WORKS -->
    <section class="wrap">
      <header class="sec-head" v-reveal>
        <p class="eyebrow">A simple loop</p>
        <h2>Run it. Point at it. Watch.</h2>
        <p class="sub">Three steps from a fresh terminal to seeing every email your app sends.</p>
      </header>
      <div class="steps">
        <article class="card step" v-reveal="0">
          <span class="num">01</span>
          <div class="vis term"><span><span class="p">$</span>npx mailnest<span class="caret" /></span></div>
          <h3>Start Mailnest</h3>
          <p>One command. SMTP on port 1025, the inbox on 1080. Nothing to install first.</p>
        </article>
        <article class="card step" v-reveal="100">
          <span class="num">02</span>
          <div class="vis cfg"><div><div><span class="k">SMTP_HOST</span>=127.0.0.1</div><div><span class="k">SMTP_PORT</span>=1025</div><div class="dim"># no TLS, no password</div></div></div>
          <h3>Point your app at it</h3>
          <p>Any framework that speaks SMTP works. Laravel, Rails, Django, Node, Go and more.</p>
        </article>
        <article class="card step" v-reveal="200">
          <span class="num">03</span>
          <div class="vis notif"><div class="toast"><span class="dot" /><div><b>Verify your email</b><small>Acme · just now</small></div></div></div>
          <h3>Watch mail arrive</h3>
          <p>Messages show up live with no refresh, ready to preview, inspect and check.</p>
        </article>
      </div>
    </section>

    <!-- FEATURES -->
    <section class="wrap">
      <header class="sec-head" v-reveal>
        <p class="eyebrow">Everything in one inbox</p>
        <h2>Catch the problem before your users do.</h2>
        <p class="sub">A small tool with no missing pieces. Hover a card to see it work.</p>
      </header>
      <div class="features">
        <article class="card feat" v-reveal="0">
          <div class="vis inbox-v">
            <div class="mrow new"><b>Verify your email</b><small>now</small></div>
            <div class="mrow"><b>Your receipt #1042</b><small>2m</small></div>
            <div class="mrow"><b>Reset your password</b><small>6m</small></div>
          </div>
          <h3>Live inbox</h3>
          <p>Server sent events push each message in as it lands. Search, unread state, j and k to move.</p>
        </article>
        <article class="card feat" v-reveal="80">
          <div class="vis device-v"><div class="frame"><i /><i /><i class="s" /><i class="b" /></div></div>
          <h3>Device preview</h3>
          <p>Flip between mobile, tablet and desktop widths in a sandbox with scripts blocked.</p>
        </article>
        <article class="card feat" v-reveal="160">
          <div class="vis links-v">
            <div>
              <div><span class="ok">200</span>acme.test/pricing</div>
              <div><span class="ok">200</span>acme.test/docs</div>
              <div><span class="bad">404</span>acme.test/old-promo</div>
            </div>
          </div>
          <h3>Link checker</h3>
          <p>Requests every link in a message and shows the status, so dead links never ship.</p>
        </article>
        <article class="card feat" v-reveal="0">
          <div class="vis api-v">
            <div>
              <div><span class="m">GET</span> /api/messages/wait?to=ama@</div>
              <div class="res"><span class="pulse" /> 200 OK · Verify your email</div>
            </div>
          </div>
          <h3>REST API and webhooks</h3>
          <p>List, search, wait for and delete messages over HTTP. A JSON POST for every capture.</p>
        </article>
        <article class="card feat" v-reveal="80">
          <div class="vis release-v">
            <div class="rel"><span class="node">Mailnest</span><span class="wire"><i /></span><span class="node">Gmail</span></div>
          </div>
          <h3>Release</h3>
          <p>Forward a captured message through a real SMTP server to see it in Gmail or Outlook.</p>
        </article>
        <article class="card feat" v-reveal="160">
          <div class="vis db-v"><div class="dbrow"><span class="disk"><i /><i /><i /></span><code>--db mail.db</code></div></div>
          <h3>Keep it or bin it</h3>
          <p>In memory by default. Add one flag to keep messages across restarts in SQLite.</p>
        </article>
      </div>
    </section>

    <!-- CHECKS -->
    <section class="wrap">
      <div class="panel split">
        <div v-reveal>
          <p class="eyebrow">Email checks</p>
          <h2>Find out what Outlook will break. Before a customer does.</h2>
          <p class="sub left">
            Every message runs through checks for the things that quietly fail in real inboxes:
            relative image URLs, missing alt text, flex and grid layouts, linked stylesheets, scripts,
            missing plain text, and HTML big enough for Gmail to clip.
          </p>
          <a class="link" :href="withBase('/guide/checks')">See every check <span class="arr">→</span></a>
        </div>
        <div class="check-card">
          <div class="cc-head" v-reveal="60"><span>Checks</span><span class="score"><b>1</b> error · <b>3</b> warnings</span></div>
          <ul class="checks big">
            <li v-reveal="120"><span class="lvl error">error</span>Image uses a relative URL. It will not load in a real inbox.</li>
            <li v-reveal="200"><span class="lvl warn">warn</span>HTML is over 102KB. Gmail will clip the message.</li>
            <li v-reveal="280"><span class="lvl warn">warn</span>No plain text alternative. Some spam filters expect one.</li>
            <li v-reveal="360"><span class="lvl warn">warn</span>Linked stylesheet. Most clients ignore it, inline your CSS.</li>
            <li v-reveal="440"><span class="lvl info">info</span>No unsubscribe link found. Required for marketing mail.</li>
          </ul>
        </div>
      </div>
    </section>

    <!-- TESTING -->
    <section class="wrap">
      <div class="split">
        <div class="code card" v-reveal>
          <div class="code-head"><span class="dots"><i /><i /><i /></span>signup.spec.ts</div>
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
  <span class="f">expect</span>(email.text).<span class="f">toMatch</span>(<span class="s">/\d{6}/</span>)
})</code></pre>
          <div class="run"><span class="pass">✓</span> new users get a code <small>412ms</small></div>
        </div>
        <div v-reveal="120">
          <p class="eyebrow">End to end tests</p>
          <h2>Assert on the email, not just the button click.</h2>
          <p class="sub left">
            <code>waitForEmail</code> blocks until a matching message arrives, then hands you the parsed
            email. Pull the code from a verification mail or follow a reset link, in Playwright, Vitest,
            Cypress or plain <code>fetch</code>.
          </p>
          <ol class="numbered">
            <li><span>01</span>Clear the inbox before each test</li>
            <li><span>02</span>Trigger the flow in your app</li>
            <li><span>03</span>Wait for the email and read it</li>
          </ol>
          <a class="link" :href="withBase('/guide/testing')">Testing guide <span class="arr">→</span></a>
        </div>
      </div>
    </section>

    <!-- OPEN SOURCE -->
    <section class="wrap">
      <div class="oss" v-reveal>
        <ShaderBg :intensity="0.8" />
        <div class="oss-inner">
          <p class="eyebrow light">Free and open source</p>
          <h2>Built in the open. Yours to run, read and change.</h2>
          <p class="sub">MIT licensed. Read the code, file an issue, or send a pull request. Small focused changes are the easiest to review.</p>
          <div class="ctas center">
            <a class="btn white" :href="repo" target="_blank" rel="noopener">Star on GitHub <span class="arr">→</span></a>
            <a class="btn ghost" :href="withBase('/guide/contributing')">Contributing guide</a>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.mn {
  --line: var(--vp-c-divider); --muted: var(--vp-c-text-2); --soft: var(--vp-c-bg-soft); --ink: var(--vp-c-text-1);
  --ease: cubic-bezier(.2, .8, .2, 1);
  padding-bottom: 120px;
}
.wrap { max-width: 1200px; margin-left: auto; margin-right: auto; padding: 0 32px; }
.mn > section { margin-top: 140px; }
h1, h2, h3 { color: var(--ink); }
h2 { font-size: clamp(28px, 3.6vw, 44px); line-height: 1.08; font-weight: 500; letter-spacing: -0.035em; margin: 0 0 16px; }
h3 { font-size: 19px; font-weight: 500; letter-spacing: -0.02em; margin: 0 0 6px; }
p { color: var(--muted); line-height: 1.6; margin: 0; }
code { font-family: var(--vp-font-family-mono); font-size: .86em; background: var(--vp-c-default-soft); padding: 2px 6px; border-radius: 6px; color: var(--ink); }
.center { text-align: center; }
.small { font-size: 13px; }
.eyebrow { font-size: 11.5px; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; color: var(--vp-c-brand-1); margin-bottom: 14px; }
.eyebrow.light { color: #c9c3ff; }
.sec-head { text-align: center; max-width: 640px; margin: 0 auto 56px; }
.sub { font-size: 16.5px; }
.sub.left { margin-bottom: 24px; }

/* buttons and links */
.btn { display: inline-flex; align-items: center; gap: 10px; font-weight: 500; font-size: 15px; border-radius: 10px; padding: 12px 20px; text-decoration: none; transition: transform .25s var(--ease), box-shadow .25s var(--ease), background .2s; }
.mn .btn.dark { background: #100e24; color: #fff; box-shadow: 0 8px 24px -10px rgba(10, 8, 40, .5); }
.mn .btn.dark:hover { transform: translateY(-2px); box-shadow: 0 14px 30px -12px rgba(60, 40, 200, .55); background: var(--vp-c-brand-3); color: #fff; }
.btn.white { background: #fff; color: #0c0a24; }
.btn.white:hover { transform: translateY(-2px); box-shadow: 0 14px 30px -12px rgba(0, 0, 0, .6); }
.btn.ghost { color: #fff; border: 1px solid rgba(255, 255, 255, .28); background: rgba(255, 255, 255, .06); backdrop-filter: blur(6px); }
.btn.ghost:hover { background: rgba(255, 255, 255, .14); }
.link { display: inline-flex; align-items: center; gap: 8px; font-weight: 500; color: var(--ink); text-decoration: none; }
.link:hover { color: var(--vp-c-brand-1); }
.arr { display: inline-block; transition: transform .25s var(--ease); }
.btn:hover .arr, .link:hover .arr { transform: translateX(4px); }

/* reveal */
.rv { opacity: 0; transform: translateY(18px); transition: opacity .8s var(--ease), transform .8s var(--ease); }
.rv.in { opacity: 1; transform: none; }

/* HERO */
.mn > .hero { margin-top: 0; display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.12fr); min-height: min(calc(100vh - var(--vp-nav-height)), 820px); border-bottom: 1px solid var(--line); }
.hero-copy { align-self: center; min-width: 0; padding: 64px 48px 64px max(32px, calc((100vw - 1200px) / 2 + 32px)); }
.hero-copy > * { max-width: 600px; }
h1 { font-size: clamp(42px, 5.6vw, 76px); line-height: 1; font-weight: 500; letter-spacing: -0.045em; margin: 0 0 24px; }
.accent { color: var(--vp-c-brand-1); }
.lede { font-size: 18.5px; max-width: 34em; color: var(--ink); opacity: .78; }
.lede code { font-size: .82em; }
.ctas { display: flex; align-items: center; gap: 28px; margin-top: 36px; flex-wrap: wrap; }
.ctas.center { justify-content: center; gap: 12px; }
.install { margin-top: 32px; display: inline-flex; align-items: center; gap: 12px; border: 1px solid var(--line); border-radius: 10px; padding: 8px 8px 8px 14px; font-family: var(--vp-font-family-mono); font-size: 14px; color: var(--ink); background: var(--vp-c-bg); transition: border-color .2s, box-shadow .25s var(--ease); cursor: pointer; }
.install:hover { border-color: var(--vp-c-brand-2); box-shadow: 0 0 0 4px var(--vp-c-brand-soft); }
.install code { background: none; padding: 0; font-size: inherit; }
.prompt { color: var(--vp-c-brand-1); }
.copy { font-family: var(--vp-font-family-base); font-size: 12px; font-weight: 600; border-radius: 6px; padding: 4px 10px; background: var(--soft); margin-left: 12px; }
.fine { font-size: 13px; margin-top: 18px; }

.hero-stage { position: relative; overflow: hidden; display: grid; place-items: center; padding: 72px 0 72px 56px; min-height: 560px; }
.mock { position: relative; width: 100%; justify-self: end; border-radius: 14px 0 0 14px; background: var(--vp-c-bg); border: 1px solid rgba(255,255,255,.14); border-right: 0; box-shadow: 0 40px 90px -30px rgba(0, 0, 0, .7); font-size: 12.5px; overflow: hidden; transition: transform .5s var(--ease); transform-origin: right center; will-change: transform; }
.mock-top { display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; border-bottom: 1px solid var(--line); font-size: 12.5px; color: var(--ink); }
.crumb { color: var(--muted); }
.live { color: var(--muted); font-size: 11.5px; display: flex; align-items: center; gap: 7px; }
.dot { width: 7px; height: 7px; border-radius: 50%; background: #16a34a; animation: ping 2.4s infinite; }
@keyframes ping { 0% { box-shadow: 0 0 0 0 rgba(22,163,74,.45); } 70%, 100% { box-shadow: 0 0 0 7px rgba(22,163,74,0); } }
.app { display: grid; grid-template-columns: 230px minmax(0, 1fr); height: 400px; }
.side { border-right: 1px solid var(--line); display: flex; flex-direction: column; min-width: 0; }
.search { margin: 12px; border: 1px solid var(--line); border-radius: 8px; padding: 6px 10px; color: var(--muted); font-size: 11.5px; }
.list { list-style: none; margin: 0; padding: 0; overflow: hidden; }
.list li { margin: 0; padding: 10px 14px; border-top: 1px solid var(--line); cursor: pointer; display: grid; gap: 2px; min-width: 0; transition: background .2s; }
.list li:hover { background: var(--soft); }
.list li.active { background: var(--vp-c-brand-soft); }
.row { display: flex; justify-content: space-between; gap: 6px; }
.from { font-weight: 600; color: var(--ink); }
.time, .snip { color: var(--muted); font-size: 11px; }
.subj, .snip { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.subj { color: var(--ink); }
.list li.unread .subj, .list li.unread .from { font-weight: 700; }
.list li.unread { box-shadow: inset 3px 0 0 var(--vp-c-brand-3); }
.pane { display: flex; flex-direction: column; min-width: 0; }
.msg-head { padding: 14px 18px; border-bottom: 1px solid var(--line); }
.subject { font-size: 15px; font-weight: 600; color: var(--ink); letter-spacing: -.01em; }
.meta { color: var(--muted); font-size: 11.5px; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.meta b { color: var(--ink); font-weight: 600; }
.tabs { display: flex; gap: 2px; padding: 0 12px; border-bottom: 1px solid var(--line); }
.tabs button { font-size: 12px; padding: 9px 10px; color: var(--muted); border-bottom: 2px solid transparent; display: flex; align-items: center; gap: 5px; transition: color .2s; }
.tabs button:not(:disabled):hover { color: var(--ink); }
.tabs button:disabled { cursor: default; opacity: .6; }
.tabs button.on { color: var(--ink); border-bottom-color: var(--vp-c-brand-3); }
.count { background: #f59e0b; color: #fff; border-radius: 999px; font-size: 10px; font-weight: 700; padding: 0 6px; }
.preview { flex: 1; padding: 20px; background: var(--soft); overflow: hidden; }
.email { background: #fff; color: #1f2328; border-radius: 10px; padding: 22px; max-width: 330px; margin: 0 auto; box-shadow: 0 1px 3px rgba(0,0,0,.06), 0 12px 30px -16px rgba(30,20,90,.25); }
.email-logo { font-weight: 800; color: #6d5efc; letter-spacing: -0.02em; font-size: 15px; }
.email-h { font-size: 17px; font-weight: 600; margin: 14px 0 6px; letter-spacing: -.01em; }
.email-p { color: #57606a; line-height: 1.5; }
.email-btn { display: inline-block; background: #6d5efc; color: #fff; border-radius: 7px; padding: 8px 15px; margin-top: 16px; font-weight: 600; }

/* checks */
.checks { list-style: none; margin: 0; padding: 4px 18px; }
.checks li { display: flex; gap: 10px; align-items: baseline; padding: 11px 0; border-bottom: 1px solid var(--line); color: var(--ink); line-height: 1.45; margin: 0; }
.checks li:last-child { border-bottom: 0; }
.checks .ok { color: #16a34a; }
.lvl { flex: none; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; border-radius: 5px; padding: 2px 6px; }
.lvl.error { background: rgba(220,38,38,.12); color: #dc2626; }
.lvl.warn { background: rgba(217,119,6,.14); color: #c2680a; }
.lvl.info { background: var(--vp-c-brand-soft); color: var(--vp-c-brand-1); }

/* MARQUEE */
.mn > .marquee-wrap { margin-top: 72px; }
.marquee { margin-top: 22px; overflow: hidden; mask-image: linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent); }
.track { display: flex; align-items: center; gap: 64px; padding: 8px 0; width: max-content; animation: marquee 42s linear infinite; }
.marquee:hover .track { animation-play-state: paused; }
.logo { display: inline-flex; padding: 6px; color: var(--muted); opacity: .55; transition: color .25s, opacity .25s, transform .35s var(--ease); }
.logo svg { width: 36px; height: 36px; fill: currentColor; display: block; }
.logo:hover { color: var(--brand); opacity: 1; transform: translateY(-3px) scale(1.12); }
.sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
@keyframes marquee { to { transform: translateX(calc(-50% - 32px)); } }

/* cards */
.card { border: 1px solid var(--line); border-radius: 16px; background: var(--vp-c-bg); padding: 14px 14px 26px; transition: opacity .8s var(--ease), transform .35s var(--ease), box-shadow .35s var(--ease), border-color .3s; }
.card:hover { transform: translateY(-4px); border-color: color-mix(in srgb, var(--vp-c-brand-2) 40%, var(--line)); box-shadow: 0 24px 50px -28px rgba(50, 30, 160, .35); }
.card h3, .card > p { padding: 0 10px; }
.card > p { font-size: 14.5px; }
.vis { height: 170px; border-radius: 10px; background: var(--soft); margin-bottom: 22px; position: relative; overflow: hidden; display: grid; place-items: center; font-size: 12.5px; }

/* steps */
.steps { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; }
.step { position: relative; }
.num { position: absolute; top: 26px; left: 26px; z-index: 1; font-size: 11px; font-weight: 600; color: #fff; background: var(--vp-c-brand-3); border-radius: 6px; padding: 3px 7px; }
.term { font-family: var(--vp-font-family-mono); font-size: 15px; color: var(--ink); }
.term .p { color: var(--vp-c-brand-1); margin-right: 8px; }
.caret { display: inline-block; width: 8px; height: 17px; background: var(--vp-c-brand-2); margin-left: 4px; vertical-align: -3px; animation: blink 1.1s steps(1) infinite; }
@keyframes blink { 50% { opacity: 0; } }
.cfg { font-family: var(--vp-font-family-mono); font-size: 13px; color: var(--ink); line-height: 1.9; }
.cfg .k { color: var(--vp-c-brand-1); }
.cfg .dim { color: var(--muted); }
.step:hover .cfg div div:not(.dim) { animation: nudge .5s var(--ease); }
@keyframes nudge { 40% { transform: translateX(4px); } }
.notif .toast { display: flex; gap: 10px; align-items: center; background: var(--vp-c-bg); border: 1px solid var(--line); border-radius: 12px; padding: 12px 16px; box-shadow: 0 12px 28px -16px rgba(20,10,80,.4); transition: transform .45s var(--ease); }
.notif .toast b { display: block; font-size: 13px; color: var(--ink); font-weight: 600; }
.notif .toast small { color: var(--muted); font-size: 11.5px; }
.step:hover .notif .toast { transform: translateY(-6px) scale(1.04); }

/* features */
.features { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; }
.inbox-v { display: flex; flex-direction: column; align-items: stretch; gap: 8px; justify-content: center; padding: 0 28px; }
.mrow { display: flex; justify-content: space-between; background: var(--vp-c-bg); border: 1px solid var(--line); border-radius: 8px; padding: 9px 12px; color: var(--ink); transition: transform .4s var(--ease); }
.mrow b { font-weight: 500; }
.mrow small { color: var(--muted); }
.mrow.new { border-color: var(--vp-c-brand-2); box-shadow: inset 3px 0 0 var(--vp-c-brand-3); }
.feat:hover .mrow.new { animation: drop .7s var(--ease); }
.feat:hover .mrow:not(.new) { transform: translateY(2px); }
@keyframes drop { from { opacity: 0; transform: translateY(-14px); } }
.device-v .frame { width: 34%; height: 120px; background: var(--vp-c-bg); border: 1px solid var(--line); border-radius: 8px; padding: 12px; display: flex; flex-direction: column; gap: 7px; transition: width .7s var(--ease); }
.device-v .frame i { display: block; height: 7px; border-radius: 4px; background: var(--vp-c-default-soft); }
.device-v .frame i.s { width: 60%; }
.device-v .frame i.b { width: 38%; height: 18px; background: var(--vp-c-brand-3); margin-top: auto; border-radius: 5px; }
.feat:hover .device-v .frame { width: 82%; }
.links-v { font-family: var(--vp-font-family-mono); font-size: 12px; color: var(--ink); }
.links-v > div > div { display: flex; gap: 12px; padding: 5px 0; transition: transform .35s var(--ease); }
.links-v span { font-weight: 700; border-radius: 4px; padding: 0 5px; }
.links-v .ok { color: #16a34a; background: rgba(22,163,74,.12); }
.links-v .bad { color: #dc2626; background: rgba(220,38,38,.12); }
.feat:hover .links-v > div > div { transform: translateX(6px); }
.feat:hover .links-v > div > div:nth-child(2) { transition-delay: .08s; }
.feat:hover .links-v > div > div:nth-child(3) { transition-delay: .16s; }
.api-v { font-family: var(--vp-font-family-mono); font-size: 12px; color: var(--ink); }
.api-v .m { color: var(--vp-c-brand-1); font-weight: 700; }
.api-v .res { display: flex; align-items: center; gap: 8px; margin-top: 12px; color: #16a34a; opacity: .35; transition: opacity .4s; }
.pulse { width: 7px; height: 7px; border-radius: 50%; background: #16a34a; }
.feat:hover .api-v .res { opacity: 1; }
.feat:hover .pulse { animation: ping 1.2s infinite; }
.rel { display: flex; align-items: center; }
.node { background: var(--vp-c-bg); border: 1px solid var(--line); border-radius: 8px; padding: 8px 12px; font-weight: 600; color: var(--ink); }
.wire { position: relative; width: 80px; height: 2px; background: repeating-linear-gradient(90deg, var(--vp-c-divider) 0 6px, transparent 6px 11px); }
.wire i { position: absolute; top: -4px; left: 0; width: 10px; height: 10px; border-radius: 50%; background: var(--vp-c-brand-3); box-shadow: 0 0 12px var(--vp-c-brand-2); opacity: 0; }
.feat:hover .wire i { animation: travel 1.1s var(--ease) infinite; }
@keyframes travel { 0% { left: 0; opacity: 0; } 15% { opacity: 1; } 85% { opacity: 1; } 100% { left: calc(100% - 10px); opacity: 0; } }
.dbrow { display: flex; gap: 16px; align-items: center; }
.disk { display: grid; gap: 4px; }
.disk i { display: block; width: 46px; height: 13px; border-radius: 50%; border: 2px solid var(--vp-c-brand-2); background: var(--vp-c-bg); transition: transform .4s var(--ease); }
.feat:hover .disk i:nth-child(1) { transform: translateY(-5px); }
.feat:hover .disk i:nth-child(3) { transform: translateY(5px); }

/* split panels */
.split { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.05fr); gap: 72px; align-items: center; }
.panel { border: 1px solid var(--line); border-radius: 24px; padding: 64px; background: linear-gradient(180deg, var(--vp-c-bg) 0%, var(--soft) 100%); }
.check-card { border: 1px solid var(--line); border-radius: 16px; background: var(--vp-c-bg); box-shadow: 0 30px 60px -36px rgba(40, 20, 140, .35); }
.cc-head { display: flex; justify-content: space-between; padding: 14px 20px; border-bottom: 1px solid var(--line); font-size: 13px; color: var(--ink); font-weight: 600; }
.score { font-weight: 400; color: var(--muted); }
.score b { color: var(--ink); font-weight: 600; }
.checks.big { padding: 6px 20px; font-size: 14px; }
.checks.big li { transition: background .2s, padding .3s var(--ease), opacity .8s var(--ease), transform .8s var(--ease); border-radius: 8px; }
.checks.big li:hover { background: var(--soft); padding-left: 8px; }

/* code */
.code { padding: 0; overflow: hidden; }
.code-head { display: flex; align-items: center; gap: 14px; font-size: 12px; color: var(--muted); padding: 12px 16px; border-bottom: 1px solid var(--line); font-family: var(--vp-font-family-mono); }
.dots { display: flex; gap: 6px; }
.dots i { width: 10px; height: 10px; border-radius: 50%; background: var(--vp-c-default-3); }
.code pre { margin: 0; padding: 18px; overflow-x: auto; font-size: 13px; line-height: 1.65; }
.code pre code { background: none; padding: 0; font-size: inherit; color: var(--ink); }
.k { color: #8250df; } .s { color: #0a7f4f; } .f { color: #0550ae; }
.dark .k { color: #c4a7ff; } .dark .s { color: #7ee2a8; } .dark .f { color: #8cc8ff; }
.run { border-top: 1px solid var(--line); padding: 12px 18px; font-family: var(--vp-font-family-mono); font-size: 12.5px; color: var(--ink); background: var(--soft); }
.run small { color: var(--muted); }
.pass { color: #16a34a; font-weight: 700; margin-right: 6px; }
.numbered { list-style: none; padding: 0; margin: 0 0 28px; border-top: 1px solid var(--line); }
.numbered li { display: flex; gap: 18px; padding: 14px 0; border-bottom: 1px solid var(--line); color: var(--ink); margin: 0; transition: padding .3s var(--ease), color .2s; }
.numbered li:hover { padding-left: 8px; color: var(--vp-c-brand-1); }
.numbered span { font-size: 12px; color: var(--muted); font-variant-numeric: tabular-nums; padding-top: 3px; }

/* oss */
.oss { position: relative; border-radius: 28px; overflow: hidden; min-height: 440px; display: grid; place-items: center; }
.oss-inner { position: relative; text-align: center; max-width: 640px; padding: 72px 32px; pointer-events: none; }
.oss-inner a { pointer-events: auto; }
.oss h2 { color: #fff; }
.oss .sub { color: rgba(255, 255, 255, .72); }

/* transitions */
.slide-enter-active { transition: all .5s var(--ease); }
.slide-enter-from { opacity: 0; transform: translateY(-14px); }
.slide-move { transition: transform .5s var(--ease); }
.fade-enter-active, .fade-leave-active { transition: opacity .18s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

@media (prefers-reduced-motion: reduce) {
  .track { animation: none; flex-wrap: wrap; justify-content: center; width: auto; gap: 16px 32px; }
  .track .logo[aria-hidden="true"] { display: none; }
  .marquee { mask-image: none; }
  .dot, .caret, .feat:hover * { animation: none !important; }
  .mock, .card { transition: none; }
}

/* responsive */
@media (min-width: 1440px) {
  .mn > .hero { grid-template-columns: calc((100vw - 1200px) / 2 + 680px) minmax(0, 1fr); }
  .hero-stage { padding-right: 56px; }
  .mock { max-width: 980px; justify-self: start; border-radius: 14px; border-right: 1px solid rgba(255,255,255,.14); transform-origin: center; }
}
@media (max-width: 1024px) {
  .mn > .hero { grid-template-columns: minmax(0, 1fr); min-height: 0; }
  .hero-copy { padding: 56px 32px 48px; max-width: none; }
  .hero-stage { padding: 48px 0 48px 32px; min-height: 0; }
  .split { grid-template-columns: minmax(0, 1fr); gap: 48px; }
  .panel { padding: 40px; }
  .features, .steps { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 640px) {
  .wrap { padding: 0 16px; }
  .mn > section { margin-top: 96px; }
  .mn > .hero { margin-top: 0; }
  .mn > .marquee-wrap { margin-top: 56px; }
  .hero-copy { padding: 40px 16px 36px; }
  .hero-stage { padding: 32px 0 32px 16px; }
  .app { grid-template-columns: minmax(0, 1fr); height: auto; }
  .side { display: none; }
  .preview { min-height: 240px; }
  .features, .steps { grid-template-columns: minmax(0, 1fr); }
  .panel { padding: 28px 20px; border-radius: 18px; }
  .ctas { gap: 20px; }
  .oss { border-radius: 20px; }
}
</style>
<style>
.dark .mn .btn.dark { background: #fff; color: #100e24; }
.dark .mn .logo { opacity: .8; }
.dark .mn .logo:hover { opacity: 1; }
</style>
