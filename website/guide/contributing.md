# Contributing

Mailnest is open source under the [MIT license](https://github.com/cnaallotey/mailnest/blob/main/LICENSE). Bug reports, ideas and pull requests are all welcome.

## Ways to help

- **Report a bug:** [open an issue](https://github.com/cnaallotey/mailnest/issues/new) with your Node version, the command you ran and what you expected.
- **Suggest a check:** if an email broke in a client and Mailnest did not warn you, that is a good candidate for a new [check](./checks).
- **Improve the docs:** every page has an "Edit this page on GitHub" link at the bottom.
- **Send a pull request:** small, focused pull requests are the easiest to review. For larger features, open an issue first so we can agree on the approach.

## Local setup

```bash
git clone https://github.com/cnaallotey/mailnest.git
cd mailnest
npm install
npm run dev
```

`npm run dev` starts the UI on `http://localhost:3000` and SMTP on port `1025`.

## Running the tests

```bash
npm run build && npm test
```

The tests are end to end smoke tests that run against the built app.

## Updating the client support data

The Clients tab uses a snapshot of the [Can I email](https://www.caniemail.com) dataset. To refresh it:

```bash
node scripts/update-caniemail.mjs
```

The script downloads the latest data, keeps the latest result per client, and writes `lib/caniemail.json`. It prints any features it has no detector for. Commit the changed file.

## Project layout

| Path | What lives there |
| --- | --- |
| `server/` | SMTP capture, storage and the REST API (Nitro) |
| `lib/checks.mjs` | The email checks, plus link and code extraction, shared by the server and `mailnest check` |
| `app/` | The inbox UI (Nuxt and Vue) |
| `lib/compat.mjs`, `lib/caniemail.json` | The client support report and its bundled Can I email data |
| `scripts/update-caniemail.mjs` | Refreshes `lib/caniemail.json` from caniemail.com |
| `bin/` | The CLI entry point and the `check` command |
| `Dockerfile` | The published container image |
| `client/` | The `mailnest/client` test helper |
| `website/` | This documentation site (VitePress) |

## Working on the docs

```bash
cd website
npm install
npm run dev
```
