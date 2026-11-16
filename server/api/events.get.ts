import { bus } from '../utils/bus'

export default defineEventHandler(async (event) => {
  setHeader(event, 'x-accel-buffering', 'no')
  setHeader(event, 'cache-control', 'no-cache, no-transform')
  const stream = createEventStream(event)
  const onMsg = (m: unknown) => stream.push({ event: 'message', data: JSON.stringify(m) })
  const onClear = (inbox?: string) => stream.push({ event: 'cleared', data: JSON.stringify(inbox ? { inbox } : {}) })
  bus.on('message', onMsg)
  bus.on('cleared', onClear)
  const ping = setInterval(() => stream.push({ event: 'ping', data: '{}' }), 15000)
  stream.onClosed(() => { clearInterval(ping); bus.off('message', onMsg); bus.off('cleared', onClear) })
  // Flush headers right away so clients see the connection as open.
  void stream.push({ event: 'ready', data: '{}' })
  return stream.send()
})
