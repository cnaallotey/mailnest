# JavaScript client

A tiny, dependency free helper for tests, included in the `mailnest` package.

```js
import { Mailnest } from 'mailnest/client'
```

It uses the global `fetch`, so it runs in Node 18+, Bun, Deno and test runners like Playwright, Vitest and Jest. TypeScript types are included.

## `new Mailnest(options?)`

```js
const mail = new Mailnest() // http://127.0.0.1:1080
const mail = new Mailnest('http://127.0.0.1:8025')
const mail = new Mailnest({ baseUrl: 'http://127.0.0.1:8025', inbox: 'worker-1' })
```

| Option | Description |
| --- | --- |
| `baseUrl` | The web UI address. Defaults to `http://127.0.0.1:1080`. A trailing slash is ignored. |
| `inbox` | Next release. Scope this client to a [named inbox](../guide/testing#parallel-tests). `list`, `waitForEmail` and `clear` then only touch that inbox. |

## `mail.inbox(name)` <Badge type="tip" text="next release" />

Returns a new client scoped to a named inbox, with the same base URL.

```js
const worker = mail.inbox('worker-1')
```

## `mail.address(email)` <Badge type="tip" text="next release" />

Adds the client's inbox as a plus tag, so mail sent to the result is routed to it. Returns the address unchanged on an unscoped client.

```js
mail.inbox('worker-1').address('ama@user.test') // 'ama+worker-1@user.test'
```

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
email.inbox        // 'worker-1', or '' for none
email.links        // every http(s) link in the HTML and text parts
email.codes        // numeric codes of 4 to 8 digits found in the body
```

From the next release, `inbox`, `links` and `codes` are included, and messages returned by `waitForEmail` and `get` also have two helpers. Both take a string (contains) or a RegExp, and return the first match or `undefined`. With no argument they return the first item.

```js
email.link(/\/reset\//)  // 'https://app.test/reset/abc'
email.code()             // '482913'
email.code(/^\d{6}$/)    // first six digit code
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

Deletes every message, or only that inbox's messages on a scoped client. Call it in `beforeEach` so tests do not see each other's mail.

```js
await mail.clear()
```

## Errors

Any non 2xx response throws an `Error` with the status and body, for example `Mailnest 408: …` when `waitForEmail` times out.

## Types

The package ships TypeScript types for the client and for messages:

```ts
import type { Mailnest, Message, MessageSummary, MailnestOptions, WaitOptions } from 'mailnest/client'

interface MailnestOptions { baseUrl?: string; inbox?: string }
interface WaitOptions { to?: string; subject?: string; timeout?: number; since?: number }

class Mailnest {
  constructor(options?: string | MailnestOptions)
  inbox(name: string): Mailnest
  address(email: string): string
  list(query?: Record<string, string>): Promise<{ total: number; unread: number; messages: MessageSummary[] }>
  get(id: string): Promise<Message>
  clear(): Promise<{ ok: boolean }>
  waitForEmail(opts?: WaitOptions): Promise<Message>
}
```
