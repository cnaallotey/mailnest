# Roadmap

These are proposed features, grouped by when we expect to work on them. Nothing here is promised, and the order changes based on what people need. Each item explains the problem it solves.

Have an opinion, or want to build one? [Open an issue](https://github.com/cnaallotey/mailnest/issues/new) or comment on an existing one. Shipped work moves to the [changelog](./changelog).

## Recently shipped

These were on this roadmap and are now built. See the [changelog](./changelog).

In 0.3.0:

- **Client compatibility report.** [Guide](./guide/checks#client-support)
- **Dark mode preview.** [Guide](./guide/inbox#dark-mode-preview)
- **STARTTLS support.** [Guide](./guide/connect-your-app#apps-that-require-tls)

In 0.2.0:

- **Separate inboxes for parallel tests.** [Guide](./guide/testing#parallel-tests)
- **Official Docker image.** [Guide](./guide/docker)
- **Content helpers in the test client:** `email.links`, `email.codes`, `email.link()` and `email.code()`. [Guide](./guide/testing#codes-and-links)
- **`mailnest check` for CI.** [Guide](./guide/checks#check-templates-in-ci)

## Now

### Simulate SMTP failures

**Problem:** retry and error handling in mail code is hard to test because a local server always says yes.

**Proposal:** rules that make Mailnest reject or delay chosen messages, so you can test how your app recovers:

```bash
npx mailnest --fail "to:*@bounce.test=550" --delay "subject:Digest=3000"
```

### Deliverability hints

**Problem:** mail that looks fine locally can still land in spam.

**Proposal:** a Deliverability tab that flags common spam signals (a high image to text ratio, URL shorteners, a mismatched `From` and `Reply-To`, a missing `List-Unsubscribe` header) and shows the `Authentication-Results`, DKIM and SPF headers when they are present.

## Next

- **Snapshot testing:** save a rendered screenshot of an email and fail a test when it changes visually.
- **Import .eml files:** drag a `.eml` file into the inbox to inspect mail captured elsewhere.
- **Signed webhooks with retries:** an HMAC signature header and a retry with backoff when the receiving endpoint is down.
- **Clients for other languages:** small `waitForEmail` helpers for Python, Ruby and PHP test suites.
- **Accessibility checks:** a missing `lang` attribute, low colour contrast, layout tables without `role="presentation"`, and links with no text.
- **IMAP access:** read captured mail in a desktop client such as Thunderbird or Apple Mail.
