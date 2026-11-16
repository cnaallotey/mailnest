import { tlsMaterial } from '../utils/smtp'

// The certificate Mailnest presents for STARTTLS, so a client can be told to trust it.
export default defineEventHandler((event) => {
  const tls = tlsMaterial()
  if (!tls) throw createError({ statusCode: 404, statusMessage: 'TLS is off. Start Mailnest with --tls.' })
  setHeader(event, 'content-type', 'application/x-pem-file')
  setHeader(event, 'content-disposition', 'attachment; filename="mailnest.pem"')
  return tls.cert
})
