# Contributing

1. `npm install`
2. `npm run dev` starts the UI on http://localhost:3000 and SMTP on 1025.
3. `npm run build && npm test` runs the end to end smoke tests against the built app.

Small, focused pull requests are easiest to review. Open an issue first for larger features.
Server code lives in `server/` (SMTP capture, storage, API). The UI is in `app/`. The email checks are in `lib/checks.mjs`, shared by the server and the `mailnest check` command in `bin/`. The docs site is in `website/`.
