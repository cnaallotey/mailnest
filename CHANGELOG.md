# Changelog

All notable changes to Mailnest are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and Mailnest uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- **Client support report:** a Clients tab and `GET /api/messages/:id/compat` list the HTML and CSS features a message uses that email clients do not support, using bundled [Can I email](https://www.caniemail.com) data (over 250 features). `scripts/update-caniemail.mjs` refreshes the data.
- **Dark mode preview:** the HTML tab can show a message with its own `prefers-color-scheme: dark` styles applied, or with an approximation of the forced colour inversion some clients use. Also available as `?scheme=dark` and `?scheme=invert` on `GET /api/messages/:id/html`.
- **STARTTLS:** `--tls` offers STARTTLS with a self-signed certificate made at startup, for apps that require an encrypted connection. `--tls-key` and `--tls-cert` use your own certificate. `GET /api/tls-cert` returns the certificate in use, and `/api/config` reports `tls`. Plain SMTP keeps working and remains the default.

## [0.2.0] - 2026-11-16

Named inboxes for parallel tests, link and code helpers, a template linter for CI and a Docker image.

### Added

- **Named inboxes for parallel tests.** Mail sent to a plus address such as `ama+worker-1@user.test`, or by a client that logs in with an SMTP username, is routed to a named inbox. Pass `inbox` to `GET /api/messages`, `GET /api/messages/wait` and `DELETE /api/messages` to list, wait on or clear only that inbox. `GET /api/inboxes` lists them, and the inbox UI gains a filter. Requests without `inbox` behave as before.
- **Test client:** `new Mailnest({ baseUrl, inbox })`, `mail.inbox(name)` and `mail.address(email)` for named inboxes.
- **Links and codes:** `GET /api/messages/:id` now returns `links` and `codes`, and client messages have `email.link(match)` and `email.code(match)`.
- **`mailnest check`:** runs the email checks on `.html` and `.eml` files without starting the server, with `--fail-on`, `--ignore` and `--json`, and exits with code 1 on problems.
- **Docker image:** a `Dockerfile` with a health check, and a workflow that publishes `ghcr.io/cnaallotey/mailnest` for `linux/amd64` and `linux/arm64` on version tags.
- Full TypeScript types for messages in `mailnest/client` (`Message`, `MessageSummary`).
- Documentation website at [cnaallotey.github.io/mailnest](https://cnaallotey.github.io/mailnest/), with guides, an API reference, a roadmap and this changelog.
- `mailnest --version`.
- `homepage`, `bugs` and `repository` links in `package.json`, so the npm page points to the docs and GitHub.

### Changed

- The `cleared` server sent event now carries `{ "inbox": "name" }` when a single inbox is cleared.
- The email checks moved to `lib/checks.mjs` so the server and the CLI share them.

### Fixed

- The `subject` check now fires for messages with no subject. It never did, because the empty subject was replaced with a placeholder before the checks ran.
- Header, link and settings tables in the inbox now wrap their rows in `<tbody>`, removing Vue hydration warnings.

## [0.1.0] - 2026-11-15

The first public release.

### Added

- **SMTP capture:** a local SMTP server on port 1025 that accepts any message, with optional SMTP auth (`--user`, `--pass`) and a configurable size limit (`MAILNEST_MAX_SIZE_MB`).
- **Live inbox:** a web UI on port 1080 that updates over server sent events, with search, unread state, mark unread, j and k keyboard navigation, and desktop notifications.
- **Message views:** HTML preview at mobile, tablet and desktop widths in a sandbox with scripts blocked; plain text, raw source and parsed headers; inline `cid:` images; attachment and `.eml` downloads.
- **Email checks:** 13 rules covering relative image URLs, missing alt text, scripts, flex and grid layouts, positioning, linked stylesheets, empty links, missing plain text, Gmail clipping, a missing subject, viewport and unsubscribe links.
- **Link checker:** requests every link in a message and reports the status code.
- **REST API:** list, search, fetch, wait for, mark read and delete messages; a server sent events stream at `/api/events`.
- **Webhooks:** a JSON `POST` for every captured message.
- **Release:** forward a captured message through a real SMTP server with `--relay`.
- **Storage:** in memory by default, or persistent with `--db` (SQLite), with a retention limit (`--max`, default 500).
- **Test client:** `mailnest/client` with `waitForEmail`, `list`, `get` and `clear`, with TypeScript types.
- **CLI:** `npx mailnest` with flags for every option and matching environment variables.

[Unreleased]: https://github.com/cnaallotey/mailnest/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/cnaallotey/mailnest/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/cnaallotey/mailnest/releases/tag/v0.1.0
