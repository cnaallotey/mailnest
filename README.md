# Mailnest

A modern, local email catcher for development. Point your app's SMTP at it, and every email shows up in a live inbox. A fresh take on MailCatcher, built on Nuxt and Node.

**Docs:** https://cnaallotey.github.io/mailnest/

```bash
npx mailnest
```

Then send mail to `localhost:1025` and open http://127.0.0.1:1080.

## Features

- Live inbox over server sent events, with search, unread state, and j/k keyboard navigation
- HTML preview with mobile, tablet and desktop widths, sandboxed with scripts blocked
- Text, raw source, and full header views, plus .eml download and attachment download
- Inline images (cid) render correctly
- Clients tab: which HTML and CSS each email client will drop, from Can I email data
- Dark mode preview, with the email's own dark styles or an approximation of forced inversion
- Checks tab: missing alt text, relative image URLs, scripts, flex/grid layouts, Gmail clipping, missing text part and more
- Link checker that requests every link in the message
- REST API, webhooks, and a `waitForEmail` helper for Playwright, Vitest and friends
- Release: forward a captured message through a real SMTP server
- Named inboxes, so parallel test workers never see or clear each other's mail
- `mailnest check` lints template files in CI and fails the build on errors
- Optional persistence in a SQLite file, optional SMTP auth, message retention limit
- Docker image with a health check

## Options

| Flag | Default | Purpose |
| --- | --- | --- |
| `--smtp-port` | 1025 | SMTP port |
| `--http-port` | 1080 | Web UI and API port |
| `--host` | 127.0.0.1 | Web UI bind address |
| `--db <file>` | memory | Persist to SQLite |
| `--relay <url>` | off | Enable Release, e.g. `smtp://user:pass@host:587` |
| `--max <n>` | 500 | Messages to keep |
| `--user`, `--pass` | off | Require SMTP auth |
| `--tls` | off | Offer STARTTLS with a self-signed certificate (or `--tls-key` and `--tls-cert` for your own) |
| `--open` | off | Open the browser |

Every flag also has an environment variable, for example `MAILNEST_SMTP_PORT` and `MAILNEST_DB`. Requires Node 22.13 or newer.

## Testing helper

```js
import { Mailnest } from 'mailnest/client'

const mail = new Mailnest('http://127.0.0.1:1080')
await mail.clear()
// trigger your app to send a signup email, then:
const email = await mail.waitForEmail({ to: 'new@user.test', subject: 'Welcome', timeout: 8000 })
const code = email.code()              // first 4 to 8 digit code in the body
const link = email.link(/\/verify\//)  // first matching link
```

### Parallel tests

Give each test worker a named inbox. Mail to a plus address is routed to it, and `clear()` and `waitForEmail()` only touch that inbox.

```js
const mail = new Mailnest({ inbox: `worker-${workerIndex}` })
await mail.clear()
const address = mail.address('new@user.test') // new+worker-0@user.test
```

## Check templates in CI

```bash
npx mailnest check emails/ --fail-on warn
```

Runs the email checks on `.html` and `.eml` files without starting the server, and exits with code 1 when it finds problems. Use `--ignore rule1,rule2` to skip rules and `--json` for machine readable output.

## Docker

```bash
docker run --rm -p 127.0.0.1:1080:1080 -p 127.0.0.1:1025:1025 ghcr.io/cnaallotey/mailnest
```

Add `--db /data/mail.db` and a volume at `/data` to keep messages. Available from version 0.2.0.

## API

| Route | Description |
| --- | --- |
| `GET /api/messages?q=&to=&subject=&inbox=` | List and search |
| `GET /api/messages/:id` | Message with attachments, links, codes and checks |
| `GET /api/messages/:id/raw` | Original .eml |
| `GET /api/messages/:id/compat` | Client support report |
| `GET /api/messages/wait?to=&subject=&inbox=&timeout=` | Block until a match arrives |
| `GET /api/inboxes` | Named inboxes with message counts |
| `DELETE /api/messages` and `/api/messages/:id` | Clear (all, or one inbox with `?inbox=`) or delete |
| `GET /api/events` | Server sent events stream |
| `POST /api/messages/:id/release` | Forward via relay, body `{ "to": ["a@b.c"] }` |
| `GET/POST /api/webhooks`, `DELETE /api/webhooks/:id` | Manage webhooks |

Webhooks receive `{ "event": "message.received", "message": { ... } }`.

## Security

Mailnest is a development tool. The web UI binds to localhost by default and has no login. Do not expose it to the internet. The link checker makes outbound requests to URLs found in captured mail.

## Development

See CONTRIBUTING.md and CHANGELOG.md. MIT licensed.
