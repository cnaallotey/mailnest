export interface Check { level: 'error' | 'warn' | 'info'; rule: string; message: string }
export function runChecks(m: { html: string; text: string; subject: string; size?: number }): Check[]
export function extractLinks(html: string, text: string): string[]
export function extractCodes(html: string, text: string): string[]
export function normalizeInbox(s: unknown): string
