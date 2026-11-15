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
  const link = email.html.match(/href="([^"]*\/reset\/[^"]+)"/)[1]

  await page.goto(link)
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
