import { getMessage } from '../../../utils/store'
import { compatReport } from '../../../../lib/compat.mjs'
import data from '../../../../lib/caniemail.json'

// Which HTML and CSS features this message uses that some email clients do not support.
export default defineEventHandler((event) => {
  const m = getMessage(getRouterParam(event, 'id')!)
  if (!m) throw createError({ statusCode: 404 })
  return compatReport(m.html, data)
})
