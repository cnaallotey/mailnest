# Email checks

Every message Mailnest captures runs through a set of checks. They catch the problems that look fine in a browser but break, get clipped or get flagged in real inboxes. Open the **Checks** tab on any message to see them. The same list comes back as `checks` from [`GET /api/messages/:id`](../reference/api#get-a-message).

Each check has a level:

- **error**: the email is broken for some or all readers
- **warn**: likely to cause problems in common clients
- **info**: worth knowing, may be fine for your case

## All checks

| Rule | Level | Triggered when |
| --- | --- | --- |
| `subject` | error | The message has no subject. |
| `img-relative` | error | An `<img>` uses a relative URL (not `http:`, `https:`, `cid:` or `data:`). It will not load in a real inbox. |
| `script` | error | The HTML contains a `<script>` tag. Email clients strip or block scripts. |
| `text-part` | warn | There is an HTML part but no plain text alternative. Some clients and spam filters expect one. |
| `gmail-clip` | warn | The HTML is over 102 KB. Gmail clips it and hides the rest behind "View entire message". |
| `img-alt` | warn | One or more images have no `alt` attribute. |
| `external-css` | warn | The HTML links an external stylesheet. Most clients ignore it, so inline your CSS. |
| `css-layout` | warn | The HTML uses `display: flex` or `display: grid`. Outlook desktop and some other clients do not support them, so use tables. |
| `css-position` | warn | The HTML uses `position: absolute` or `position: fixed`, which is poorly supported. |
| `empty-link` | warn | A link has an empty `href` or `href="#"`. |
| `html` | info | There is no HTML part, so this is a plain text email. |
| `viewport` | info | There is no viewport meta tag, so mobile clients may scale the message down. |
| `unsubscribe` | info | No unsubscribe link was found. Required for marketing mail, fine for transactional mail. |

## Link checker

The **Links** tab goes one step further. It collects every `http` and `https` link from the HTML and text parts (up to 50) and requests each one, six at a time, following redirects. Each link shows its final status code, or the error if the request failed.

These requests go out from your machine to the real URLs. See [Security](./security).

## Using checks in CI

Since checks are part of the API response, you can fail a test when an email has errors:

```js
import { Mailnest } from 'mailnest/client'

const mail = new Mailnest()
const email = await mail.waitForEmail({ subject: 'Your receipt' })
const errors = email.checks.filter(c => c.level === 'error')
expect(errors).toEqual([])
```
