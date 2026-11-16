# Connect your app

Mailnest speaks plain SMTP, so any framework or language can use it. Use these settings everywhere:

| Setting | Value |
| --- | --- |
| Host | `127.0.0.1` (or `localhost`) |
| Port | `1025` |
| Encryption / TLS | none |
| Username / password | none, unless you started Mailnest with `--user` and `--pass` |

Below are the usual places to put them. Only use these settings in development.

## Node.js (Nodemailer)

```js
import nodemailer from 'nodemailer'

export const transport = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? '127.0.0.1',
  port: Number(process.env.SMTP_PORT ?? 1025),
  secure: false,
})
```

## Laravel

In `.env`:

```ini
MAIL_MAILER=smtp
MAIL_HOST=127.0.0.1
MAIL_PORT=1025
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_ENCRYPTION=null
```

## Ruby on Rails

In `config/environments/development.rb`:

```ruby
config.action_mailer.delivery_method = :smtp
config.action_mailer.smtp_settings = { address: '127.0.0.1', port: 1025 }
```

## Django

In your development settings:

```python
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = '127.0.0.1'
EMAIL_PORT = 1025
EMAIL_USE_TLS = False
```

## Phoenix (Swoosh)

In `config/dev.exs`:

```elixir
config :my_app, MyApp.Mailer,
  adapter: Swoosh.Adapters.SMTP,
  relay: "127.0.0.1",
  port: 1025,
  tls: :never,
  auth: :never
```

## Spring Boot

In `application-dev.properties`:

```properties
spring.mail.host=127.0.0.1
spring.mail.port=1025
```

## Go (net/smtp)

```go
err := smtp.SendMail("127.0.0.1:1025", nil, "app@example.test",
    []string{"you@example.test"}, []byte("Subject: Hello\r\n\r\nIt works"))
```

## .NET (MailKit)

```csharp
using var client = new SmtpClient();
await client.ConnectAsync("127.0.0.1", 1025, SecureSocketOptions.None);
await client.SendAsync(message);
```

## Apps running in Docker

If your app runs in a container and Mailnest runs on your machine, `127.0.0.1` inside the container points at the container itself. Use the host instead:

- **Docker Desktop (macOS, Windows):** host `host.docker.internal`, port `1025`
- **Linux:** add `extra_hosts: ["host.docker.internal:host-gateway"]` to the service, then use the same host

The SMTP server binds to `0.0.0.0` by default, so it accepts these connections. The web UI stays on `127.0.0.1`.

You can also run Mailnest itself as a container next to your app. See [Run with Docker](./docker).

## Apps that require TLS <Badge type="tip" text="next release" />

By default Mailnest speaks plain SMTP and does not offer STARTTLS. If your app or framework insists on an encrypted connection, start Mailnest with `--tls`:

```bash
npx mailnest --tls
```

Mailnest then offers STARTTLS on the same port, using a self-signed certificate it creates at startup. Plain connections keep working, so nothing else has to change.

Because the certificate is self-signed, your app has to be told to accept it. Pick one:

- **Skip verification in development.** Most mail libraries have a setting for this, such as `tls: { rejectUnauthorized: false }` in Nodemailer or `'verify_peer' => false` on the SMTP mailer in Laravel's `config/mail.php`.
- **Trust the certificate.** Download it from `http://127.0.0.1:1080/api/tls-cert` (or the Settings panel) and pass it to your client as a CA. It is valid for `localhost`, `127.0.0.1`, `::1` and `host.docker.internal`. A new one is made each time Mailnest starts.
- **Bring your own.** For a certificate that stays the same between runs, create one with a tool such as [mkcert](https://github.com/FiloSottile/mkcert) and pass both files:

  ```bash
  mkcert localhost 127.0.0.1
  npx mailnest --tls-key localhost+1-key.pem --tls-cert localhost+1.pem
  ```

Mailnest supports STARTTLS (the connection starts plain and upgrades). It does not support implicit TLS, where the connection is encrypted from the first byte, usually on port 465. In your app, choose "STARTTLS" or `secure: false`.

## Changing the ports

If 1025 or 1080 is taken:

```bash
npx mailnest --smtp-port 2525 --http-port 8025
```

Then use port `2525` in your app's settings. See [CLI and environment](../reference/cli) for all options.
