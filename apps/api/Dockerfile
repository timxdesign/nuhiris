FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@11.7.0 --activate
WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY apps/api/ apps/api/
COPY packages/ packages/
RUN pnpm install --frozen-lockfile
# Chained with && and no output suppression: a failing workspace build must
# fail the image, not silently produce one with no dist/main.js.
RUN pnpm --filter @nuhiris/shared-types build && \
    pnpm --filter @nuhiris/crypto-utils build && \
    pnpm --filter @nuhiris/fhir-utils build && \
    pnpm --filter @nuhiris/api build && \
    test -f apps/api/dist/main.js

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser
EXPOSE 3000
CMD ["node", "apps/api/dist/main.js"]
