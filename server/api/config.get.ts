import { config } from '../utils/config'
import pkg from '../../package.json'

export default defineEventHandler(() => ({
  smtpPort: config.smtpPort,
  persistent: config.db !== ':memory:',
  relayEnabled: !!config.relayUrl,
  tls: config.tls,
  maxMessages: config.maxMessages,
  version: pkg.version,
}))
