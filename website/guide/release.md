# Release to a real inbox

Sometimes you need to see an email in Gmail, Outlook or Apple Mail. **Release** forwards a captured message, unchanged, through a real SMTP server to addresses you choose.

## Turn it on

Start Mailnest with `--relay` and an SMTP URL:

```bash
npx mailnest --relay smtp://user:pass@smtp.example.com:587
```

Or set `MAILNEST_RELAY_URL`. Any SMTP provider works, for example your email service's SMTP credentials or a Gmail app password.

Once set up, a **Release** button appears on every message. Enter one or more addresses, separated by commas, and send.

## From the API

```bash
curl -X POST http://127.0.0.1:1080/api/messages/<id>/release \
  -H 'content-type: application/json' \
  -d '{ "to": ["you@gmail.com"] }'
```

## Things to know

- The original message is sent as is, so the `From` address stays the same. Your relay provider may reject or rewrite senders you have not verified.
- Releasing sends real email that counts against your provider's sending limits.
- The relay URL contains your SMTP password. Keep it in an environment variable rather than in shell history or committed scripts.
