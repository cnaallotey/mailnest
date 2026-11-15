# Webhooks

Mailnest can POST a JSON payload to any URL each time it captures a message. Use this to drive local automation, post to a chat channel, or feed a test harness that cannot hold a connection open.

## Add a webhook

From the **Settings** panel in the inbox, or the API:

```bash
curl -X POST http://127.0.0.1:1080/api/webhooks \
  -H 'content-type: application/json' \
  -d '{ "url": "http://localhost:4000/hooks/mail" }'
```

## Payload

```json
{
  "event": "message.received",
  "message": {
    "id": "a1b2c3d4e5f6",
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
}
```

The payload holds the message summary. Fetch `GET /api/messages/:id` for the full HTML, text, headers and checks.

## Delivery

- Sent as `POST` with `content-type: application/json`.
- Fire and forget: there are no retries, and failures are ignored.
- Each request times out after 5 seconds.
- Webhooks are stored with your messages. With `--db` they persist across restarts, otherwise they reset when Mailnest stops.

## A minimal receiver

```js
import { createServer } from 'node:http'

createServer((req, res) => {
  let body = ''
  req.on('data', c => (body += c))
  req.on('end', () => {
    const { message } = JSON.parse(body)
    console.log(`📬 ${message.subject} → ${message.to.map(t => t.address).join(', ')}`)
    res.end('ok')
  })
}).listen(4000)
```
