# JavaScript client

A tiny, dependency free helper for tests, included in the `mailnest` package.

```js
import { Mailnest } from 'mailnest/client'
```

It uses the global `fetch`, so it runs in Node 18+, Bun, Deno and test runners like Playwright, Vitest and Jest. TypeScript types are included.

## `new Mailnest(baseUrl?)`

```js
const mail = new Mailnest() // http://127.0.0.1:1080
const mail = new Mailnest('http://127.0.0.1:8025')
```

`baseUrl` is the web UI address. A trailing slash is ignored.

## `mail.waitForEmail(options?)`

Resolves with the **full message** (same shape as [`GET /api/messages/:id`](./api#get-a-message)) once a match arrives, or right away if one already exists. Rejects if the timeout passes first.

```js
const email = await mail.waitForEmail({
  to: 'ama@user.test',   // recipient contains, case insensitive
  subject: 'Verify',     // subject contains, case insensitive
  timeout: 8000,         // ms, default 10000, max 60000
  since: Date.now(),     // only messages received at or after this time
})

email.subject      // 'Verify your email'
email.text         // plain text body
email.html         // HTML body
email.headers      // { 'message-id': '…', … }
email.attachments  // [{ idx, filename, contentType, size, cid }]
email.checks       // [{ level, rule, message }]
```

## `mail.list(query?)`

Lists messages, newest first. Accepts the same query fields as [`GET /api/messages`](./api#list-and-search).

```js
const { total, unread, messages } = await mail.list({ q: 'receipt', limit: '10' })
```

## `mail.get(id)`

Fetches one full message by id and marks it as read.

```js
const email = await mail.get(messages[0].id)
```

## `mail.clear()`

Deletes every message. Call it in `beforeEach` so tests do not see each other's mail.

```js
await mail.clear()
```

## Errors

Any non 2xx response throws an `Error` with the status and body, for example `Mailnest 408: …` when `waitForEmail` times out.

## Types

```ts
interface WaitOptions { to?: string; subject?: string; timeout?: number; since?: number }

class Mailnest {
  constructor(baseUrl?: string)
  list(query?: Record<string, string>): Promise<{ total: number; unread: number; messages: any[] }>
  get(id: string): Promise<any>
  clear(): Promise<{ ok: boolean }>
  waitForEmail(opts?: WaitOptions): Promise<any>
}
```
