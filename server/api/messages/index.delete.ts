import { clearMessages } from '../../utils/store'
import { bus } from '../../utils/bus'

export default defineEventHandler(() => { clearMessages(); bus.emit('cleared'); return { ok: true } })
