# syntax=docker/dockerfile:1

# ---- build: compile the Nuxt app ----
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY nuxt.config.ts ./
COPY app ./app
COPY server ./server
COPY lib ./lib
COPY public ./public
RUN npm run build

# ---- runtime: only what `mailnest` needs to run ----
FROM node:22-alpine
ENV NODE_ENV=production \
    # Listen on every interface inside the container. Publish the ports to 127.0.0.1 on the host.
    HOST=0.0.0.0 \
    PORT=1080 \
    MAILNEST_SMTP_PORT=1025
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force
COPY --from=build /app/.output ./.output
COPY bin ./bin
COPY lib ./lib
COPY client ./client
COPY LICENSE README.md ./

# Mount a volume here and pass `--db /data/mail.db` to keep messages across restarts.
RUN mkdir /data && chown node:node /data
VOLUME /data
USER node
EXPOSE 1025 1080
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 1080) + '/api/config').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"
ENTRYPOINT ["node", "bin/mailnest.mjs"]
