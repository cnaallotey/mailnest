import nodemailer from 'nodemailer'
import { config } from '../../../utils/config'
import { getRaw, getSummary } from '../../../utils/store'

// Forward a captured message through a real SMTP server (MAILNEST_RELAY_URL), to chosen recipients.
export default defineEventHandler(async (event) => {
  if (!config.relayUrl) throw createError({ statusCode: 400, statusMessage: 'Relay not configured. Set MAILNEST_RELAY_URL or --relay.' })
  const id = getRouterParam(event, 'id')!
  const raw = getRaw(id)
  const s = getSummary(id)
  if (!raw || !s) throw createError({ statusCode: 404 })
  const body = await readBody<{ to?: string[] }>(event)
  const to = (body?.to || []).map(x => String(x).trim()).filter(Boolean)
  if (!to.length) throw createError({ statusCode: 400, statusMessage: 'Provide at least one recipient in "to".' })
  const transport = nodemailer.createTransport(config.relayUrl)
  const info = await transport.sendMail({ envelope: { from: s.from?.address || 'mailnest@localhost', to }, raw: Buffer.from(raw) })
  return { ok: true, accepted: info.accepted, rejected: info.rejected }
})
