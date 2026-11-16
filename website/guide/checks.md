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

## Check templates in CI <Badge type="tip" text="0.2.0+" />

`mailnest check` runs the same checks on template files, without starting the server. It exits with code 1 when it finds a problem, so a broken template fails the build.

```bash
npx mailnest check emails/
```

```
✓ emails/welcome.html

emails/receipt.html
  error  Image uses a relative URL. It will not load in a real inbox.  img-relative
  warn   1 image(s) missing alt text.  img-alt

2 files checked: 1 error, 1 warning, 0 info
```

Pass files, folders (searched for `.html`, `.htm` and `.eml`) or quoted globs such as `"emails/**/*.html"`.

| Option | Description |
| --- | --- |
| `--fail-on <level>` | Fail on `error` (default), `warn` or `info` and anything worse. `never` always exits 0. |
| `--ignore <rules>` | Comma separated rules to skip, for example `--ignore unsubscribe,viewport`. |
| `--json` | Print the results as JSON for other tools. |

An `.html` file is only the HTML part of a message, so the `subject`, `text-part` and `html` rules are skipped for it. An `.eml` file is a whole message and gets every rule.

::: tip Templates with placeholders
Check the rendered output where you can. A source template with placeholders, such as `src="{{ logo_url }}"`, will trip `img-relative`. Either render first or use `--ignore img-relative`.
:::

In GitHub Actions:

```yaml
- run: npx mailnest check emails/ --fail-on warn
```

## Check sent mail in tests

Checks are also part of the API response, so you can fail a test when a real email has errors:

```js
import { Mailnest } from 'mailnest/client'

const mail = new Mailnest()
const email = await mail.waitForEmail({ subject: 'Your receipt' })
const errors = email.checks.filter(c => c.level === 'error')
expect(errors).toEqual([])
```
