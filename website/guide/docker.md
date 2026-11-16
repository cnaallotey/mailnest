# Run with Docker <Badge type="tip" text="next release" />

Mailnest publishes an image to the GitHub Container Registry, so you can run it without installing Node.

::: warning Published from the next release
The image is built from version tags. It becomes available at `ghcr.io/cnaallotey/mailnest` with the first release after 0.1.0. Until then, build it yourself with `docker build -t mailnest .` from the repository.
:::

## Quick start

```bash
docker run --rm -p 127.0.0.1:1080:1080 -p 127.0.0.1:1025:1025 ghcr.io/cnaallotey/mailnest
```

Open `http://127.0.0.1:1080` and send mail to `127.0.0.1:1025`.

Publishing the ports to `127.0.0.1` keeps Mailnest reachable only from your machine. The web UI has no login, so do not publish it on a public interface. See [Security](./security).

## Docker Compose

Other services in the same compose file reach Mailnest by its service name:

```yaml
services:
  app:
    build: .
    environment:
      SMTP_HOST: mail
      SMTP_PORT: 1025

  mail:
    image: ghcr.io/cnaallotey/mailnest
    ports:
      - "127.0.0.1:1080:1080" # inbox, for your browser
```

The SMTP port does not need publishing unless something outside Docker sends mail too.

## Keeping messages

Messages live in memory by default. To keep them across restarts, mount a volume at `/data` and point `--db` at it:

```yaml
  mail:
    image: ghcr.io/cnaallotey/mailnest
    command: ["--db", "/data/mail.db"]
    volumes:
      - mailnest:/data

volumes:
  mailnest:
```

## Options

Anything after the image name is passed to `mailnest`, and every [environment variable](../reference/cli) works:

```bash
docker run --rm -p 127.0.0.1:1080:1080 -p 127.0.0.1:1025:1025 \
  -e MAILNEST_MAX_MESSAGES=2000 \
  ghcr.io/cnaallotey/mailnest --relay smtp://user:pass@smtp.example.com:587
```

Inside the container the UI listens on `0.0.0.0:1080` and SMTP on `0.0.0.0:1025`.

## Health check

The image has a built in health check against `/api/config`, so compose can wait for it:

```yaml
  app:
    depends_on:
      mail:
        condition: service_healthy
```

## Checking templates

The image also runs [`mailnest check`](./checks#check-templates-in-ci):

```bash
docker run --rm -v "$PWD/emails:/emails:ro" ghcr.io/cnaallotey/mailnest check /emails
```

## Tags

| Tag | Meaning |
| --- | --- |
| `latest` | The newest release |
| `1.2.3` | An exact version |
| `1.2` | The newest patch release of a minor version |

Images are built for `linux/amd64` and `linux/arm64`.
