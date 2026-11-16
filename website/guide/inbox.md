# The inbox

Open `http://127.0.0.1:1080` after starting Mailnest. The left column lists captured messages, newest first. The right side shows the selected message.

## Live updates

The inbox keeps a server sent events connection open. New messages appear the moment Mailnest receives them, and the green dot next to the name shows the connection is live. Unread messages are shown in bold until you open them, and **Mark unread** puts one back. You can also turn on desktop notifications from the empty inbox screen.

## Search and navigation

- Type in the search box to filter by subject, sender or body text.
- Press <kbd>j</kbd> and <kbd>k</kbd> to move down and up the list.

## Named inboxes <Badge type="tip" text="0.2.0+" />

If your tests route mail into [named inboxes](./testing#parallel-tests), a filter appears under the search box. Pick an inbox to see only its mail. **Clear** then empties just that inbox. With "All inboxes" selected, each message shows a small tag with its inbox name.

## Message tabs

| Tab | What it shows |
| --- | --- |
| **HTML** | The rendered email. Switch between mobile (375px), tablet (768px) and desktop (full width) to check responsive layouts. |
| **Text** | The plain text part, or a note if there is none. |
| **Source** | The raw message exactly as it arrived over SMTP. |
| **Headers** | Every header, parsed into a table. |
| **Checks** | Problems that will hurt the email in real inboxes. See [Email checks](./checks). |
| **Clients** | Which HTML and CSS in the email each mail client does not support. See [Client support](./checks#client-support). |
| **Links** | Mailnest requests every link in the message and shows the HTTP status. |

### Dark mode preview <Badge type="tip" text="0.3.0+" />

Next to the width buttons, the HTML tab has three colour modes:

| Mode | What it shows |
| --- | --- |
| **light** | The email as sent. |
| **dark** | The email with its own `@media (prefers-color-scheme: dark)` styles applied, as Apple Mail and Outlook on macOS show it in dark mode. |
| **inverted** | An approximation of clients that recolour every email themselves, such as Gmail on phones and Outlook on Windows. Images keep their colours. |

If an email has no dark mode styles, **dark** looks the same as **light**, and Mailnest says so. That is what Apple Mail does too. **inverted** is a rough guide, because each client uses its own rules. Use it to spot problems such as a dark logo on a transparent background disappearing, then confirm in the real client with [Release](./release).

### HTML preview safety

The HTML preview renders inside a sandboxed iframe with scripts blocked, so a captured message cannot run code in your browser. Inline images that use `cid:` references render in place.

## Attachments and downloads

Attachments are listed under the message header and download with one click. You can also download the whole message as an `.eml` file to open in a desktop mail client.

## Clearing messages

Delete a single message with **Delete** in its header, or empty the inbox with **Clear** at the top of the list. By default messages live in memory and disappear when Mailnest stops. To keep them, start with `--db mail.db`.

## Settings

The settings panel shows the current SMTP port, storage mode, retention limit and whether [Release](./release) is set up. You can also add and remove [webhooks](../reference/webhooks) there.
