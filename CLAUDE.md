# NUHIRIS — Agent Context

## What This Is
National Unified Health Identity and Records Integration System for Nigeria. Monorepo with NestJS API, Next.js web portal, and shared packages.

## Tech Stack
- **Monorepo**: Turborepo + pnpm workspaces
- **Backend**: NestJS 11, TypeScript 5.x strict, TypeORM 0.3.x, PostgreSQL 16, Redis 7
- **Frontend**: Next.js 15 (App Router), Tailwind CSS 4, shadcn/ui, Zustand, TanStack Query
- **Auth**: Keycloak 25, OAuth 2.0/OIDC, JWT RS256
- **Testing**: Jest + Supertest (API), Vitest + RTL (Web)

## Commands
```bash
pnpm install                          # install all dependencies
pnpm turbo run build                  # build all packages and apps
pnpm turbo run lint                   # lint everything
pnpm turbo run type-check             # TypeScript check
pnpm --filter @nuhiris/api dev        # start API in watch mode
pnpm --filter @nuhiris/web dev        # start web portal
pnpm --filter @nuhiris/api test:unit  # API unit tests
docker compose up -d                  # start dev environment
```

## Structure
```
apps/api/         — NestJS backend (port 3000)
apps/web/         — Next.js frontend (port 3001)
apps/mobile/      — React Native (Phase 2)
packages/shared-types/   — TypeScript types/enums/interfaces
packages/crypto-utils/   — AES-256-GCM, HMAC, SHA-256
packages/fhir-utils/     — FHIR R4 resource builders
packages/ui-components/  — Shared React components
```

## Coding Rules
- TypeScript strict mode. No `any`, no `@ts-ignore`.
- snake_case for DB columns, camelCase for TS, PascalCase for classes, kebab-case for files.
- One NestJS module per domain. No cross-module service injection — use EventEmitter.
- Audit logging on every patient data access. Synchronous writes.
- NIN encrypted at rest (AES-256-GCM). Never in API responses.
- No secrets in source code. Use env vars / Vault.
- Every service method needs a unit test. Every endpoint needs integration tests.

## Spec
All requirements in `projecctbrief.md` — the single source of truth.
