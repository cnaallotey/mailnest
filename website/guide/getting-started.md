# Getting started

Mailnest is a fake SMTP server with a live web inbox. Your app sends mail to it like it would to any real server, and instead of going out to the internet, every message shows up at `http://127.0.0.1:1080`.

## Requirements

Node.js **22.13 or newer**. Check with `node -v`.

## Run it

No install needed:

```bash
npx mailnest
```

You will see:

```
[mailnest] UI http://127.0.0.1:1080
```

Mailnest is now listening for SMTP on port `1025` and serving the inbox on port `1080`. Add `--open` to open the browser for you.

### Install it in a project

If your team runs Mailnest every day, add it as a dev dependency so everyone gets the same version:

::: code-group

```bash [npm]
npm install --save-dev mailnest
```

```bash [pnpm]
pnpm add -D mailnest
```

```bash [yarn]
yarn add -D mailnest
```

:::

Then add a script to `package.json`:

```json
{
  "scripts": {
    "mail": "mailnest --open"
  }
}
```

### Install it globally

```bash
npm install -g mailnest
mailnest
```

### Run it with Docker <Badge type="tip" text="next release" />

```bash
docker run --rm -p 127.0.0.1:1080:1080 -p 127.0.0.1:1025:1025 ghcr.io/cnaallotey/mailnest
```

See [Run with Docker](./docker) for compose files and persistence.

## Send a test email

Point any SMTP client at host `127.0.0.1`, port `1025`, with no TLS and no password. A quick check with Node and Nodemailer:

```js
import nodemailer from 'nodemailer'

const transport = nodemailer.createTransport({ host: '127.0.0.1', port: 1025, secure: false })

await transport.sendMail({
  from: 'app@example.test',
  to: 'you@example.test',
  subject: 'Hello from Mailnest',
  html: '<h1>It works</h1><p>This email never left your machine.</p>',
})
```

The message appears in the inbox right away, without a refresh.

## Next steps

- [Connect your app](./connect-your-app): settings for Laravel, Rails, Django, Docker and more
- [The inbox](./inbox): what each tab shows and the keyboard shortcuts
- [Testing with Mailnest](./testing): wait for emails in end to end tests
- [CLI and environment](../reference/cli): every option
