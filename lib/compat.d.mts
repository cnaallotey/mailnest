export interface CompatClient { family: string; name: string; major: boolean; platforms: string[]; notes: string[] }
export interface CompatFeature {
  slug: string; title: string; category: 'css' | 'html' | 'image' | 'others'; url: string
  /** error: unsupported in a major client. warn: partly supported in a major client. info: only smaller clients affected. */
  level: 'error' | 'warn' | 'info'
  unsupported: CompatClient[]; partial: CompatClient[]
}
export interface CompatReport {
  updated: string
  counts: { error: number; warn: number; info: number }
  clients: { family: string; name: string; major: boolean; unsupported: number; partial: number }[]
  features: CompatFeature[]
}
export const MAJOR: string[]
export function extractCss(html: string): string
export function compatReport(html: string, data: unknown): CompatReport
