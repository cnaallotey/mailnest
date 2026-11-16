// The checks live in lib/ as plain JS so the `mailnest check` CLI can run them without the server.
export { runChecks, extractLinks, extractCodes, normalizeInbox } from '../../lib/checks.mjs'
export type { Check } from '../../lib/checks.mjs'
