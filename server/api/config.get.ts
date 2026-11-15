import { config } from '../utils/config'

export default defineEventHandler(() => ({
  smtpPort: config.smtpPort,
  persistent: config.db !== ':memory:',
  relayEnabled: !!config.relayUrl,
  maxMessages: config.maxMessages,
  version: '0.1.0',
}))
