# Testing with Mailnest

Mailnest makes it easy to test flows that depend on email, like sign up verification, password resets and receipts. Your test triggers the email, waits for it to arrive, then checks what is inside.

## The JavaScript client

Mailnest ships a small client with no dependencies:

```js
import { Mailnest } from 'mailnest/client'

const mail = new Mailnest('http://127.0.0.1:1080') // this is the default
```

The three methods you will use most:

- `mail.clear()` deletes every message, so each test starts clean
- `mail.waitForEmail({ to, subject, timeout })` resolves with the full message when a match arrives
- `email.code()` and `email.link(/reset/)` pull a passcode or a link out of the message (next release)
- `mail.list({ q })` searches what is already there

See the [client reference](../reference/client) for every method and option.

## Playwright

```ts
import { test, expect } from '@playwright/test'
import { Mailnest } from 'mailnest/client'

const mail = new Mailnest()

test.beforeEach(() => mail.clear())

test('password reset link works', async ({ page }) => {
  await page.goto('/forgot-password')
  await page.fill('#email', 'ama@user.test')
  await page.click('text=Send reset link')

  const email = await mail.waitForEmail({ to: 'ama@user.test', subject: 'Reset your password' })

  await page.goto(email.link(/\/reset\//))
  await expect(page.getByRole('heading')).toHaveText('Choose a new password')
})
```

## Vitest or Jest

```ts
import { beforeEach, expect, test } from 'vitest'
import { Mailnest } from 'mailnest/client'
import { sendWelcomeEmail } from '../src/mailer'

const mail = new Mailnest()
beforeEach(() => mail.clear())

test('welcome email has the user name', async () => {
  await sendWelcomeEmail({ name: 'Ama', email: 'ama@user.test' })
  const email = await mail.waitForEmail({ to: 'ama@user.test' })
  expect(email.subject).toBe('Welcome aboard, Ama')
  expect(email.text).toContain('Hi Ama')
})
```

## Codes and links <Badge type="tip" text="next release" />

Every message comes back with its links and numeric codes already found:

```js
const email = await mail.waitForEmail({ to: 'ama@user.test', subject: 'Verify' })

email.codes             // ['482913']
email.code()            // '482913', the first code
email.links             // ['https://app.test/verify?t=abc', 'https://app.test/help']
email.link(/\/verify/)  // first link matching a RegExp
email.link('help')      // or containing a string
```

A code is any run of 4 to 8 digits in the body. Numbers inside URLs are left out. If a message has other numbers of that length, such as a year, pass a pattern: `email.code(/^\d{6}$/)`.

## Parallel tests <Badge type="tip" text="next release" />

When tests run in parallel against one Mailnest, they share an inbox. One worker's `clear()` deletes another worker's mail, and two tests waiting for the same subject can pick up each other's message.

Give each worker its own **named inbox**. A scoped client only lists, waits for and clears mail in its inbox:

```ts
import { test } from '@playwright/test'
import { Mailnest } from 'mailnest/client'

test('sign up sends a code', async ({ page }, testInfo) => {
  const mail = new Mailnest({ inbox: `worker-${testInfo.parallelIndex}` })
  await mail.clear() // only this worker's mail

  const email = mail.address('ama@user.test') // 'ama+worker-0@user.test'
  await page.goto('/signup')
  await page.fill('#email', email)
  await page.click('text=Create account')

  const message = await mail.waitForEmail({ subject: 'Verify' })
  await page.fill('#code', message.code())
})
```

Mail is routed to a named inbox in two ways:

1. **A plus tag on the recipient.** Mail to `ama+worker-0@user.test` goes to the `worker-0` inbox. `mail.address()` adds the tag for you. This is the one to use when all your test workers share one running app.
2. **The SMTP username.** If your app logs in to Mailnest with a username, that name is the inbox. Useful when several apps share one Mailnest. It is ignored when Mailnest itself is started with `--user`.

If a message has both, the plus tag wins. Inbox names are lower cased, and anything other than letters, digits, `.`, `-` and `_` becomes `-`.

Nothing changes for an unscoped client: `new Mailnest()` still sees and clears every message. The inbox UI shows all mail too, with a filter that appears once named inboxes exist.

## How matching works

- `to` matches any part of a recipient address, checking both the `To` header and the SMTP envelope. `to: 'ama@'` matches `ama@user.test`.
- `subject` matches any part of the subject.
- Both are case insensitive.
- If a matching message already exists, it is returned straight away. Otherwise the request waits for one.
- If nothing matches within `timeout` milliseconds (default 10000, maximum 60000), the promise rejects with a 408 error.

### Avoiding matches from earlier tests

Either call `mail.clear()` before each test, or pass `since` with a timestamp so only newer messages count:

```js
const start = Date.now()
await triggerEmail()
const email = await mail.waitForEmail({ to: 'ama@user.test', since: start })
```

## Other languages

The client is a thin wrapper around the REST API, so any language works. The key endpoint is:

```bash
curl "http://127.0.0.1:1080/api/messages/wait?to=ama@user.test&subject=Verify&timeout=10000"
```

It returns the matching message summary. Fetch `/api/messages/:id` for the HTML, text and headers. See the [REST API reference](../reference/api).

## Running Mailnest in CI

Start Mailnest in the background before your tests:

```yaml
# GitHub Actions
- run: npx mailnest &
- run: npx wait-on http://127.0.0.1:1080
- run: npm test
```
