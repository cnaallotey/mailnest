export interface WaitOptions { to?: string; subject?: string; timeout?: number; since?: number }
export class Mailnest {
  constructor(baseUrl?: string)
  list(query?: Record<string, string>): Promise<{ total: number; unread: number; messages: any[] }>
  get(id: string): Promise<any>
  clear(): Promise<{ ok: boolean }>
  waitForEmail(opts?: WaitOptions): Promise<any>
}
