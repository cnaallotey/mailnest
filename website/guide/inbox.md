# The inbox

Open `http://127.0.0.1:1080` after starting Mailnest. The left column lists captured messages, newest first. The right side shows the selected message.

## Live updates

The inbox keeps a server sent events connection open. New messages appear the moment Mailnest receives them, and the green dot next to the name shows the connection is live. Unread messages are shown in bold until you open them, and **Mark unread** puts one back. You can also turn on desktop notifications from the empty inbox screen.

## Search and navigation

- Type in the search box to filter by subject, sender or body text.
- Press <kbd>j</kbd> and <kbd>k</kbd> to move down and up the list.

## Named inboxes <Badge type="tip" text="next release" />

If your tests route mail into [named inboxes](./testing#parallel-tests), a filter appears under the search box. Pick an inbox to see only its mail. **Clear** then empties just that inbox. With "All inboxes" selected, each message shows a small tag with its inbox name.

## Message tabs

| Tab | What it shows |
| --- | --- |
| **HTML** | The rendered email. Switch between mobile (375px), tablet (768px) and desktop (full width) to check responsive layouts. |
| **Text** | The plain text part, or a note if there is none. |
| **Source** | The raw message exactly as it arrived over SMTP. |
| **Headers** | Every header, parsed into a table. |
| **Checks** | Problems that will hurt the email in real inboxes. See [Email checks](./checks). |
| **Links** | Mailnest requests every link in the message and shows the HTTP status. |

### HTML preview safety

The HTML preview renders inside a sandboxed iframe with scripts blocked, so a captured message cannot run code in your browser. Inline images that use `cid:` references render in place.

## Attachments and downloads

Attachments are listed under the message header and download with one click. You can also download the whole message as an `.eml` file to open in a desktop mail client.

## Clearing messages

Delete a single message with **Delete** in its header, or empty the inbox with **Clear** at the top of the list. By default messages live in memory and disappear when Mailnest stops. To keep them, start with `--db mail.db`.

## Settings

The settings panel shows the current SMTP port, storage mode, retention limit and whether [Release](./release) is set up. You can also add and remove [webhooks](../reference/webhooks) there.
