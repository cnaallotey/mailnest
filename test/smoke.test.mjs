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
