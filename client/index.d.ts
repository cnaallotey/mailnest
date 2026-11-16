export interface Address { name: string; address: string }
export interface Check { level: 'error' | 'warn' | 'info'; rule: string; message: string }
export interface Attachment { idx: number; filename: string; contentType: string; size: number; cid: string }

export interface MessageSummary {
  id: string
  /** Named inbox the message was routed to, or '' for none. */
  inbox: string
  createdAt: number
  from: Address | null
  to: Address[]
  cc: Address[]
  envelopeTo: string[]
  subject: string
  size: number
  read: boolean
  attachmentCount: number
  snippet: string
}

export interface Message extends MessageSummary {
  html: string
  text: string
  headers: Record<string, string>
  attachments: Attachment[]
  checks: Check[]
  /** Every http(s) link in the HTML and text parts. */
  links: string[]
  /** Numeric codes of 4 to 8 digits found in the body, such as one-time passcodes. */
  codes: string[]
  /** First link matching a string or RegExp, or the first link when called with no argument. */
  link(match?: string | RegExp): string | undefined
  /** First code matching a string or RegExp, or the first code when called with no argument. */
  code(match?: string | RegExp): string | undefined
}

export interface MailnestOptions { baseUrl?: string; inbox?: string }
export interface WaitOptions { to?: string; subject?: string; timeout?: number; since?: number }

export class Mailnest {
  constructor(options?: string | MailnestOptions)
  readonly base: string
  readonly inboxName: string
  /** A client scoped to one named inbox. */
  inbox(name: string): Mailnest
  /** Adds this inbox as a plus tag: ama@user.test becomes ama+worker-1@user.test. */
  address(email: string): string
  list(query?: Record<string, string>): Promise<{ total: number; unread: number; messages: MessageSummary[] }>
  get(id: string): Promise<Message>
  clear(): Promise<{ ok: boolean }>
  waitForEmail(opts?: WaitOptions): Promise<Message>
}
