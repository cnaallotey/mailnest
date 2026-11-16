# CLI and environment

```bash
npx mailnest [options]
```

Every option can also be set with an environment variable. A flag wins over the variable when both are set. Flags accept `--flag value` or `--flag=value`.

## Options

| Flag | Environment variable | Default | Description |
| --- | --- | --- | --- |
| `--smtp-port <n>` | `MAILNEST_SMTP_PORT` | `1025` | Port the SMTP server listens on. |
| `--smtp-host <addr>` | `MAILNEST_SMTP_HOST` | `0.0.0.0` | Bind address for SMTP. Use `127.0.0.1` to accept mail only from this machine. |
| `--http-port <n>` | `PORT` | `1080` | Port for the web UI and API. |
| `--host <addr>` | `HOST` | `127.0.0.1` | Bind address for the web UI and API. See [Security](../guide/security) before changing it. |
| `--db <path>` | `MAILNEST_DB` | in memory | Store messages in a SQLite file so they survive restarts. |
| `--max <n>` | `MAILNEST_MAX_MESSAGES` | `500` | Keep at most this many messages. The oldest are dropped first. |
| `--relay <url>` | `MAILNEST_RELAY_URL` | off | SMTP URL used by [Release](../guide/release), e.g. `smtp://user:pass@host:587`. |
| `--user <name>` | `MAILNEST_SMTP_USER` | off | Require SMTP auth with this username. Use with `--pass`. |
| `--pass <secret>` | `MAILNEST_SMTP_PASS` | off | Password for SMTP auth. |
| `--tls` | `MAILNEST_TLS=1` | off | Offer STARTTLS with a self-signed certificate made at startup. See [Apps that require TLS](../guide/connect-your-app#apps-that-require-tls). Next release. |
| `--tls-key <file>` | `MAILNEST_TLS_KEY` | | Private key (PEM) for STARTTLS. Use with `--tls-cert`. Next release. |
| `--tls-cert <file>` | `MAILNEST_TLS_CERT` | | Certificate (PEM) for STARTTLS. Giving both files turns TLS on. Next release. |
| | `MAILNEST_MAX_SIZE_MB` | `25` | Largest message the SMTP server accepts, in megabytes. |
| `--open` | | off | Open the inbox in your default browser on start. |
| `-v`, `--version` | | | Print the version and exit. |
| `-h`, `--help` | | | Print help and exit. |

## Examples

Keep mail between restarts:

```bash
npx mailnest --db ./mail.db
```

Use different ports:

```bash
npx mailnest --smtp-port 2525 --http-port 8025
```

Require SMTP auth, to test your app's credentials handling:

```bash
npx mailnest --user dev --pass secret
```

Accept encrypted connections from apps that require TLS:

```bash
npx mailnest --tls
```

Configure through the environment, handy in Docker or CI:

```bash
MAILNEST_SMTP_PORT=2525 MAILNEST_DB=/data/mail.db npx mailnest
```

## `mailnest check` <Badge type="tip" text="0.2.0+" />

```bash
npx mailnest check <files, folders or globs...> [--fail-on <level>] [--ignore <rules>] [--json]
```

Runs the email checks on `.html`, `.htm` and `.eml` files without starting the server, and exits with code 1 when it finds a problem. See [Check templates in CI](../guide/checks#check-templates-in-ci).

| Exit code | Meaning |
| --- | --- |
| `0` | No problems at or above the `--fail-on` level |
| `1` | Problems found |
| `2` | Bad usage, or no files matched |

## Docker <Badge type="tip" text="0.2.0+" />

```bash
docker run --rm -p 127.0.0.1:1080:1080 -p 127.0.0.1:1025:1025 ghcr.io/cnaallotey/mailnest
```

See [Run with Docker](../guide/docker).

## Requirements

Node.js 22.13 or newer.
