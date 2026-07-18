FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@11.7.0 --activate
WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY apps/api/ apps/api/
COPY packages/ packages/
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @nuhiris/shared-types build 2>/dev/null; \
    pnpm --filter @nuhiris/crypto-utils build 2>/dev/null; \
    pnpm --filter @nuhiris/fhir-utils build 2>/dev/null; \
    pnpm --filter @nuhiris/api build

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser
EXPOSE 3000
CMD ["node", "apps/api/dist/main.js"]
