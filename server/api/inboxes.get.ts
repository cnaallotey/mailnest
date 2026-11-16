import { listInboxes } from '../utils/store'

// Named inboxes that currently hold mail, with message counts.
export default defineEventHandler(() => listInboxes())
