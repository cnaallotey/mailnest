# Security

Mailnest is a development tool. It is built to run on your own machine or inside a private CI job.

## Do not expose it to the internet

- The web UI and API have **no login**. Anyone who can reach port 1080 can read every captured email, delete messages and add webhooks.
- The UI binds to `127.0.0.1` by default. Only change `--host` (for example to `0.0.0.0`) on a network you trust.
- The SMTP server binds to `0.0.0.0` so containers and other devices can send to it. Use `--smtp-host 127.0.0.1` to limit it to your machine, or `--user` and `--pass` to require SMTP auth.

## Running in Docker

Inside the container the web UI listens on every interface, because that is the only way to reach it from outside the container. Keep it private by publishing the port to your machine only: `-p 127.0.0.1:1080:1080`, not `-p 1080:1080`.

## Outbound requests

Mailnest makes outbound network requests in three cases:

1. **Link checker:** opening the Links tab requests every URL found in that message.
2. **Webhooks:** each captured message is POSTed to every webhook URL you register.
3. **Release:** sends the message through the relay server you set up.

Nothing else leaves your machine. There is no telemetry.

## HTML preview

Captured HTML renders inside a sandboxed iframe with scripts disabled, so a malicious email cannot run code in your browser.

## Reporting a vulnerability

Please report security issues privately through [GitHub security advisories](https://github.com/cnaallotey/mailnest/security/advisories/new) rather than a public issue.
