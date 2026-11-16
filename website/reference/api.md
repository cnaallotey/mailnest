# REST API

The inbox UI is built on the same HTTP API you can use from scripts and tests. All routes are served from the web UI address, `http://127.0.0.1:1080` by default, and return JSON unless noted.

## Messages

### List and search

```http
GET /api/messages?q=&to=&subject=&inbox=&limit=&offset=
```

| Query | Description |
| --- | --- |
| `q` | Free text search over subject, body text, sender and recipients. |
| `to` | Recipient contains this text (checks `To` and the SMTP envelope). |
| `subject` | Subject contains this text. |
| `inbox` | Only messages in this [named inbox](../guide/testing#parallel-tests). `total` and `unread` are then counted for that inbox. |
| `limit` | Page size, default `100`, maximum `500`. |
| `offset` | Skip this many results. |

Results are newest first.

```json
{
  "total": 2,
  "unread": 1,
  "messages": [
    {
      "id": "a1b2c3d4e5f6",
      "inbox": "",
      "createdAt": 1763190000000,
      "from": { "name": "Acme", "address": "hello@acme.test" },
      "to": [{ "name": "", "address": "ama@user.test" }],
      "cc": [],
      "envelopeTo": ["ama@user.test"],
      "subject": "Verify your email",
      "size": 4821,
      "read": false,
      "attachmentCount": 0,
      "snippet": "Your code is 482913. It expires in 10 minutes."
    }
  ]
}
```

### Get a message

```http
GET /api/messages/:id
```

Returns the summary fields above plus `html`, `text`, `headers`, `attachments`, `links`, `codes` and `checks`. Fetching a message marks it as read.

```json
{
  "id": "a1b2c3d4e5f6",
  "subject": "Verify your email",
  "html": "<!doctype html>…",
  "text": "Your code is 482913…",
  "headers": { "message-id": "<…@acme.test>", "content-type": "multipart/alternative; …" },
  "attachments": [{ "idx": 0, "filename": "logo.png", "contentType": "image/png", "size": 2310, "cid": "logo" }],
  "links": ["https://acme.test/verify?t=abc"],
  "codes": ["482913"],
  "checks": [{ "level": "warn", "rule": "img-alt", "message": "1 image(s) missing alt text." }]
}
```

The `inbox`, `links` and `codes` fields and the `inbox` query parameter were added in 0.2.0. `links` holds every `http` and `https` link in the HTML and text parts. `codes` holds each run of 4 to 8 digits in the body, leaving out numbers inside URLs.

See [Email checks](../guide/checks) for every `rule`.

### Wait for a message

```http
GET /api/messages/wait?to=&subject=&inbox=&timeout=&since=
```

Holds the request open until a matching message exists, then returns its summary. Returns straight away if one already matches.

| Query | Description |
| --- | --- |
| `to` | Recipient contains this text, case insensitive. |
| `subject` | Subject contains this text, case insensitive. |
| `inbox` | Only match messages in this named inbox. |
| `timeout` | Milliseconds to wait, default `10000`, maximum `60000`. |
| `since` | Only match messages received at or after this Unix time in milliseconds. |

Responds `408` if nothing matches in time.

### Other message routes

| Route | Description |
| --- | --- |
| `GET /api/messages/:id/raw` | The original message as `message/rfc822`. Add `?download=1` to download it as `<id>.eml`. |
| `GET /api/messages/:id/html` | The HTML body as served to the preview, with `cid:` images rewritten. |
| `GET /api/messages/:id/attachments/:idx` | Download one attachment by its `idx`. |
| `GET /api/messages/:id/links` | Run the link checker. Returns `[{ url, status, ok, error? }]`. |
| `POST /api/messages/:id/read` | Mark read. Send `{ "read": false }` to mark unread. |
| `POST /api/messages/:id/release` | Forward through the relay. Body `{ "to": ["a@b.c"] }`. See [Release](../guide/release). |
| `DELETE /api/messages/:id` | Delete one message. |
| `DELETE /api/messages` | Delete every message. |
| `DELETE /api/messages?inbox=name` | Delete only the messages in one named inbox. |

## Inboxes <Badge type="tip" text="0.2.0+" />

```http
GET /api/inboxes
```

Lists the [named inboxes](../guide/testing#parallel-tests) that currently hold mail. Messages with no inbox are not counted here.

```json
[{ "name": "worker-1", "total": 3, "unread": 1 }]
```

## Live events

```http
GET /api/events
```

A [server sent events](https://developer.mozilla.org/docs/Web/API/Server-sent_events) stream.

| Event | Data |
| --- | --- |
| `ready` | `{}`, sent once when the connection opens |
| `message` | The summary of a newly captured message |
| `cleared` | `{}` when everything is cleared, or `{ "inbox": "name" }` when one named inbox is cleared |
| `ping` | `{}`, every 15 seconds to keep the connection open |

```js
const events = new EventSource('http://127.0.0.1:1080/api/events')
events.addEventListener('message', e => console.log('New mail:', JSON.parse(e.data).subject))
```

## Webhooks

| Route | Description |
| --- | --- |
| `GET /api/webhooks` | List webhooks, `[{ id, url }]`. |
| `POST /api/webhooks` | Add one. Body `{ "url": "https://…" }`. Returns `{ id, url }`. |
| `DELETE /api/webhooks/:id` | Remove one. |

See [Webhooks](./webhooks) for the payload.

## Config

```http
GET /api/config
```

```json
{ "smtpPort": 1025, "persistent": false, "relayEnabled": false, "maxMessages": 500, "version": "0.2.0" }
```

## Errors

Errors use standard HTTP status codes with a JSON body that includes `statusMessage`. The common ones are `400` for a bad request, `404` for an unknown id and `408` when a wait times out.
