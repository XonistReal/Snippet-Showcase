# Snippet Showcase API + execution sandbox.
#
# The execution engine shells out to language runtimes and sandbox tools, so the
# image bundles: node (JS/TS), python3, bash, sqlite3, and util-linux/coreutils
# for `prlimit`, `unshare`, and `timeout`.
FROM node:22-bookworm-slim

# Runtimes + sandbox tooling used by the executor.
RUN apt-get update && apt-get install -y --no-install-recommends \
      python3 \
      sqlite3 \
      bash \
      coreutils \
      util-linux \
      ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY tsconfig.json ./
COPY src ./src
RUN npm install typescript && npm run build && npm prune --omit=dev

ENV NODE_ENV=production
ENV PORT=8787
EXPOSE 8787

# Note: `unshare -rn` network isolation needs user namespaces. If the runtime
# forbids it the sandbox falls back automatically (see README). For full
# isolation, run this image in a locked-down container/VM.
CMD ["node", "dist/index.js"]
