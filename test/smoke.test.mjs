import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { createServer } from 'node:http'
import nodemailer from 'nodemailer'

const HTTP = 18080, SMTP = 11025
const base = `http://127.0.0.1:${HTTP}`
let proc, hookServer, hookHits = []

before(async () => {
  hookServer = createServer((req, res) => { let b = ''; req.on('data', c => (b += c)); req.on('end', () => { hookHits.push(JSON.parse(b)); res.end('ok') }) })
  await new Promise(r => hookServer.listen(18999, r))
  proc = spawn('node', ['bin/mailnest.mjs', '--http-port', HTTP, '--smtp-port', SMTP], { stdio: 'pipe' })
  for (let i = 0; i < 50; i++) { try { await fetch(`${base}/api/config`); return } catch { await new Promise(r => setTimeout(r, 200)) } }
  throw new Error('server did not start')
})
after(() => { proc?.kill(); hookServer?.close() })

const send = (opts) => nodemailer.createTransport({ host: '127.0.0.1', port: SMTP, secure: false, ignoreTLS: true }).sendMail(opts)

test('captures mail, parses parts, serves api', async () => {
  await fetch(`${base}/api/webhooks`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ url: 'http://127.0.0.1:18999/' }) })
  const waiter = fetch(`${base}/api/messages/wait?to=bob@example.com&subject=Welcome&timeout=5000`).then(r => r.json())
  await send({
    from: 'Alice <alice@example.com>', to: 'bob@example.com', bcc: 'hidden@example.com', subject: 'Welcome aboard',
    text: 'hello text', html: '<p>Hello <img src="cid:logo"> <a href="#">x</a></p>',
    attachments: [{ filename: 'a.txt', content: 'file body' }, { filename: 'l.png', cid: 'logo', content: Buffer.from('iVBORw0KGgo=', 'base64'), contentType: 'image/png' }],
  })
  const hit = await waiter
  assert.equal(hit.subject, 'Welcome aboard')

  const list = await (await fetch(`${base}/api/messages`)).json()
  assert.equal(list.total, 1); assert.equal(list.unread, 1)
  assert.ok(list.messages[0].envelopeTo.includes('hidden@example.com'))

  const full = await (await fetch(`${base}/api/messages/${hit.id}`)).json()
  assert.equal(full.attachments.length, 2)
  assert.ok(full.checks.some(c => c.rule === 'empty-link'))
  assert.equal((await (await fetch(`${base}/api/messages`)).json()).unread, 0)

  const html = await (await fetch(`${base}/api/messages/${hit.id}/html`)).text()
  assert.ok(html.includes(`/api/messages/${hit.id}/cid/logo`))
  const img = await fetch(`${base}/api/messages/${hit.id}/cid/logo`)
  assert.equal(img.headers.get('content-type'), 'image/png')
  const txt = full.attachments.find(a => a.filename === 'a.txt')
  const att = await (await fetch(`${base}/api/messages/${hit.id}/attachments/${txt.idx}`)).text()
  assert.equal(att, 'file body')
  assert.ok((await (await fetch(`${base}/api/messages/${hit.id}/raw`)).text()).includes('Subject: Welcome aboard'))

  await new Promise(r => setTimeout(r, 300))
  assert.equal(hookHits[0].event, 'message.received')
  assert.equal((await fetch(`${base}/api/messages?q=hello`)).status, 200)
  assert.equal((await (await fetch(`${base}/api/messages?q=nomatch`)).json()).total, 0)
})

test('sse pushes new messages and delete works', async () => {
  const ac = new AbortController()
  const res = await fetch(`${base}/api/events`, { signal: ac.signal })
  const reader = res.body.getReader()
  await send({ from: 'a@x.io', to: 'b@x.io', subject: 'live one', text: 'hi' })
  let buf = ''
  const deadline = Date.now() + 4000
  while (!buf.includes('live one') && Date.now() < deadline) { const { value } = await reader.read(); buf += new TextDecoder().decode(value) }
  ac.abort()
  assert.ok(buf.includes('event: message') && buf.includes('live one'))
  const { messages } = await (await fetch(`${base}/api/messages`)).json()
  assert.equal((await fetch(`${base}/api/messages/${messages[0].id}`, { method: 'DELETE' })).status, 200)
  await fetch(`${base}/api/messages`, { method: 'DELETE' })
  assert.equal((await (await fetch(`${base}/api/messages`)).json()).total, 0)
})

test('named inboxes keep parallel tests apart', async () => {
  const { Mailnest } = await import('../client/index.mjs')
  const root = new Mailnest(base)
  await root.clear()
  const a = new Mailnest({ baseUrl: base, inbox: 'Worker 1' }), b = root.inbox('worker-2')
  assert.equal(a.inboxName, 'worker-1')
  assert.equal(a.address('ama@user.test'), 'ama+worker-1@user.test')

  await send({ from: 'app@x.io', to: a.address('ama@user.test'), subject: 'Verify', text: 'Code 111111' })
  await send({ from: 'app@x.io', to: b.address('ama@user.test'), subject: 'Verify', text: 'Code 222222' })
  await send({ from: 'app@x.io', to: 'plain@user.test', subject: 'Verify', text: 'Code 333333' })

  // Same recipient and subject, but each worker only sees its own message.
  assert.equal((await a.waitForEmail({ to: 'ama', subject: 'Verify' })).code(), '111111')
  assert.equal((await b.waitForEmail({ to: 'ama', subject: 'Verify' })).code(), '222222')
  assert.equal((await a.list()).total, 1)
  assert.equal((await root.list()).total, 3)
  assert.deepEqual((await (await fetch(`${base}/api/inboxes`)).json()).map(i => i.name), ['worker-1', 'worker-2'])

  // Clearing one inbox leaves the others alone.
  await a.clear()
  assert.equal((await a.list()).total, 0)
  assert.equal((await b.list()).total, 1)
  assert.equal((await root.list()).total, 2)

  // The SMTP username also picks the inbox.
  await nodemailer.createTransport({ host: '127.0.0.1', port: SMTP, secure: false, ignoreTLS: true, auth: { user: 'billing-app', pass: 'x' } })
    .sendMail({ from: 'app@x.io', to: 'c@user.test', subject: 'Invoice', text: 'hi' })
  assert.equal((await root.inbox('billing-app').waitForEmail({ subject: 'Invoice' })).inbox, 'billing-app')
  await root.clear()
})

test('messages expose links and codes', async () => {
  const { Mailnest } = await import('../client/index.mjs')
  const mail = new Mailnest(base)
  await mail.clear()
  await send({
    from: 'app@x.io', to: 'd@user.test', subject: 'Reset',
    text: 'Your code is 482913. Order 77 shipped.\nReset: https://app.test/reset/abc?id=20261115',
    html: '<p>Your code is <b>482913</b></p><a href="https://app.test/reset/abc?id=20261115&amp;x=1">Reset</a> <a href="https://app.test/help">Help</a>',
  })
  const email = await mail.waitForEmail({ subject: 'Reset' })
  assert.deepEqual(email.codes, ['482913'])
  assert.equal(email.code(), '482913')
  assert.ok(email.links.includes('https://app.test/help'))
  assert.equal(email.link(/\/reset\//), 'https://app.test/reset/abc?id=20261115&x=1')
  assert.equal(email.link('help'), 'https://app.test/help')
  assert.equal(email.link('nope'), undefined)
  assert.ok(!('link' in JSON.parse(JSON.stringify(email))))
  await mail.clear()
})

test('a message with no subject is flagged', async () => {
  await send({ from: 'app@x.io', to: 'e@user.test', text: 'no subject here' })
  const hit = await (await fetch(`${base}/api/messages/wait?to=e@user.test&timeout=4000`)).json()
  const full = await (await fetch(`${base}/api/messages/${hit.id}`)).json()
  assert.ok(full.checks.some(c => c.rule === 'subject'))
  await fetch(`${base}/api/messages`, { method: 'DELETE' })
})

test('mailnest check lints template files', async () => {
  const run = (...a) => new Promise((resolve) => {
    const p = spawn('node', ['bin/mailnest.mjs', 'check', ...a], { stdio: 'pipe' })
    let out = ''
    p.stdout.on('data', d => (out += d)); p.stderr.on('data', d => (out += d))
    p.on('close', code => resolve({ code, out }))
  })
  assert.equal((await run('test/fixtures/good.html', '--fail-on', 'info')).code, 0)
  const bad = await run('test/fixtures/bad.html')
  assert.equal(bad.code, 1)
  assert.ok(bad.out.includes('img-relative') && !bad.out.includes('text-part'))
  assert.equal((await run('test/fixtures/bad.html', '--ignore', 'img-relative')).code, 0)
  assert.equal((await run('test/fixtures/bad.html', '--ignore', 'img-relative', '--fail-on', 'warn')).code, 1)
  const json = JSON.parse((await run('test/fixtures', '--json', '--fail-on', 'never')).out)
  assert.equal(json.files, 2); assert.equal(json.error, 1); assert.equal(json.ok, true)
  assert.equal((await run('test/fixtures/missing.html')).code, 2)
})

test('clients tab reports unsupported features', async () => {
  await send({
    from: 'app@x.io', to: 'f@user.test', subject: 'Layout',
    html: '<html><head><style>.a{display:flex;gap:8px} @media (prefers-color-scheme: dark){.a{color:#fff}}</style></head><body><div class="a" style="max-width:600px">hi</div></body></html>',
  })
  const hit = await (await fetch(`${base}/api/messages/wait?to=f@user.test&timeout=4000`)).json()
  const report = await (await fetch(`${base}/api/messages/${hit.id}/compat`)).json()
  const flex = report.features.find(f => f.slug === 'css-display-flex')
  assert.equal(flex.level, 'error')
  assert.ok(flex.unsupported.some(c => c.family === 'outlook' && c.platforms.includes('Windows')))
  assert.ok(report.features.some(f => f.slug === 'css-at-media-prefers-color-scheme'))
  assert.ok(!report.features.some(f => f.slug === 'css-display-grid'))
  assert.ok(report.clients.find(c => c.family === 'outlook').unsupported >= 2)
  assert.match(report.updated, /^\d{4}-\d{2}-\d{2}$/)

  // Dark mode preview: the dark media query is made to match, and inversion adds a filter.
  const dark = await (await fetch(`${base}/api/messages/${hit.id}/html?scheme=dark`)).text()
  assert.ok(!dark.includes('prefers-color-scheme') && dark.includes('@media (min-width: 0px)'))
  assert.ok((await (await fetch(`${base}/api/messages/${hit.id}/html?scheme=invert`)).text()).includes('invert(1)'))
  assert.ok((await (await fetch(`${base}/api/messages/${hit.id}/html`)).text()).includes('prefers-color-scheme: dark'))
  await fetch(`${base}/api/messages`, { method: 'DELETE' })
})

test('STARTTLS is off by default and on with --tls', async () => {
  const tlsOpts = { host: '127.0.0.1', secure: false, requireTLS: true, tls: { rejectUnauthorized: false } }
  // The default server does not offer STARTTLS, so a client that requires it must fail.
  await assert.rejects(nodemailer.createTransport({ ...tlsOpts, port: SMTP }).sendMail({ from: 'a@x.io', to: 'b@x.io', subject: 'tls', text: 'x' }))
  assert.equal((await fetch(`${base}/api/tls-cert`)).status, 404)

  const H = 18090, S = 11035, b = `http://127.0.0.1:${H}`
  const p = spawn('node', ['bin/mailnest.mjs', '--tls', '--http-port', H, '--smtp-port', S], { stdio: 'pipe' })
  try {
    for (let i = 0; i < 50; i++) { try { await fetch(`${b}/api/config`); break } catch { await new Promise(r => setTimeout(r, 200)) } }
    assert.equal((await (await fetch(`${b}/api/config`)).json()).tls, true)
    // Encrypted, trusting the certificate Mailnest hands out.
    const ca = await (await fetch(`${b}/api/tls-cert`)).text()
    assert.ok(ca.includes('BEGIN CERTIFICATE'))
    const info = await nodemailer.createTransport({ host: 'localhost', port: S, secure: false, requireTLS: true, tls: { ca } })
      .sendMail({ from: 'a@x.io', to: 'b@x.io', subject: 'over tls', text: 'x' })
    assert.ok(info.accepted.includes('b@x.io'))
    // Plain SMTP still works on the same port.
    await nodemailer.createTransport({ host: '127.0.0.1', port: S, secure: false, ignoreTLS: true }).sendMail({ from: 'a@x.io', to: 'c@x.io', subject: 'plain', text: 'x' })
    assert.equal((await (await fetch(`${b}/api/messages`)).json()).total, 2)
  } finally { p.kill() }
})

test('self-signed certificate is valid for localhost', async () => {
  const { selfSigned } = await import('../lib/selfsigned.mjs')
  const { X509Certificate } = await import('node:crypto')
  const x = new X509Certificate(selfSigned().cert)
  assert.ok(x.verify(x.publicKey))
  assert.equal(x.checkHost('localhost'), 'localhost')
  assert.equal(x.checkIP('127.0.0.1'), '127.0.0.1')
  assert.equal(x.checkHost('example.com'), undefined)
})
