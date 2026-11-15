import { EventEmitter } from 'node:events'

type G = typeof globalThis & { __mailnestBus?: EventEmitter }
const g = globalThis as G
export const bus = (g.__mailnestBus ||= new EventEmitter().setMaxListeners(0))
