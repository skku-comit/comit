# Build context must be the repository root (pnpm workspace).
FROM node:26.8.1-bookworm-slim AS base
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && npm install --global pnpm@12.3.4
WORKDIR /app

FROM base AS build
COPY . .
RUN pnpm install --frozen-lockfile --filter @comit/api...
RUN cd apps/api \
    && node node_modules/prisma/build/index.js generate \
    && node node_modules/@nestjs/cli/bin/nest.js build

FROM base AS runtime
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3002
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/package.json /app/pnpm-workspace.yaml /app/pnpm-lock.yaml ./
COPY --from=build --chown=node:node /app/packages ./packages
COPY --from=build --chown=node:node /app/apps/api/package.json ./apps/api/package.json
COPY --from=build --chown=node:node /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=build --chown=node:node /app/apps/api/dist ./apps/api/dist
COPY --from=build --chown=node:node /app/apps/api/prisma ./apps/api/prisma
WORKDIR /app/apps/api
USER node
EXPOSE 3002
# Failed migrations prevent the API from starting with an incompatible schema.
# Invoke the installed CLI directly: pnpm run can auto-install workspace deps.
CMD ["sh", "-c", "node node_modules/prisma/build/index.js migrate deploy && exec node dist/main.js"]
