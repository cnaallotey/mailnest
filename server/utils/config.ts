const num = (v: string | undefined, d: number) => (v && Number.isFinite(+v) ? +v : d)

export const config = {
  smtpPort: num(process.env.MAILNEST_SMTP_PORT, 1025),
  smtpHost: process.env.MAILNEST_SMTP_HOST || '0.0.0.0',
  db: process.env.MAILNEST_DB || ':memory:',
  relayUrl: process.env.MAILNEST_RELAY_URL || '',
  maxMessages: num(process.env.MAILNEST_MAX_MESSAGES, 500),
  maxSizeMb: num(process.env.MAILNEST_MAX_SIZE_MB, 25),
  authUser: process.env.MAILNEST_SMTP_USER || '',
  authPass: process.env.MAILNEST_SMTP_PASS || '',
  // STARTTLS is offered when --tls is set, or when both a key and a certificate file are given.
  tls: /^(1|true|yes|on)$/i.test(process.env.MAILNEST_TLS || '') || !!(process.env.MAILNEST_TLS_KEY && process.env.MAILNEST_TLS_CERT),
  tlsKey: process.env.MAILNEST_TLS_KEY || '',
  tlsCert: process.env.MAILNEST_TLS_CERT || '',
}
