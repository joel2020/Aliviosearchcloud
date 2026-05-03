# Alivio Search Cloud

Customer dashboard for the Alivio Search Cloud product — an AI workforce platform
(12 production agents + business assistant) for small businesses.

## Architecture

pnpm monorepo with three runtime artifacts:

- `artifacts/app` — React + Vite customer dashboard, mounted at `/`. Dark-first
  premium UI built on shadcn + tailwind v4 + framer-motion. Uses `@clerk/react`
  v6 for auth (Replit-managed Clerk whitelabel) and `wouter` for routing.
- `artifacts/api-server` — Express 5 API mounted at `/api`. Uses `@clerk/express`
  for auth, Drizzle ORM for Postgres, Azure OpenAI via `@workspace/azure-openai`.
- `artifacts/mockup-sandbox` — Component preview server for canvas mockups.

Shared libraries:

- `lib/db` — Drizzle schemas: `users`, `businesses`, `agentRuns`,
  `assistantConversations`, `assistantMessages`, `assistantChannelConnections`.
  Schema files import `zod/v4` because drizzle-zod emits Zod 4 types.
- `lib/api-spec` — OpenAPI source of truth (`openapi.yaml`). Run
  `pnpm --filter @workspace/api-spec run codegen` after editing.
- `lib/api-zod` / `lib/api-client-react` — generated zod schemas + React Query
  hooks consumed by the API server (validation) and app (queries/mutations).
- `lib/azure-openai` — thin wrapper around the `openai` SDK's `AzureOpenAI`
  client. Reads `AZURE_OPENAI_ENDPOINT` and `AZURE_OPENAI_API_KEY`; deployment
  defaults to `gpt-4o`, api version `2024-08-01-preview` (override with
  `AZURE_OPENAI_DEPLOYMENT` / `AZURE_OPENAI_API_VERSION`).

## Auth flow (Clerk + Drizzle)

- `clerkProxyMiddleware` is mounted **before** body parsers so it can stream raw
  bytes to the Clerk Frontend API in production.
- `clerkMiddleware` runs after parsers and populates `req.auth`.
- `requireAuth` extracts `userId` from `getAuth(req)` and stores it on
  `req.clerkUserId` (typed via `declare global { namespace Express { … } }`).
- `lib/ensure.ts` provides race-safe `ensureUser` / `ensureBusiness` helpers
  that use `onConflictDoNothing` + re-select fallback. The `businesses.owner_id`
  column has a `UNIQUE` constraint guaranteeing 1:1 owner→workspace.
- CORS uses an explicit allowlist built from `CORS_ALLOWED_ORIGINS`,
  `REPLIT_DOMAINS`, and `REPLIT_DEV_DOMAIN` — never `origin: true` with
  `credentials: true`.

## Canonical commands

- `pnpm install`
- `pnpm --filter @workspace/api-spec run codegen` — regenerate zod + React Query
  hooks after editing `openapi.yaml`. Also runs `typecheck:libs`.
- `pnpm --filter @workspace/db run push` — push Drizzle schema to Postgres.
- `pnpm run typecheck` — full repo typecheck (libs + leaf packages).

## Required env vars / secrets

- `DATABASE_URL` (Replit-managed)
- `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `VITE_CLERK_PUBLISHABLE_KEY`
- `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_API_KEY`
- Optional: `AZURE_OPENAI_DEPLOYMENT`, `AZURE_OPENAI_API_VERSION`,
  `CORS_ALLOWED_ORIGINS`

## Conventions

- Never run `pnpm dev` at the workspace root — use Replit workflows.
- Never use `console.log` in server code — use `req.log` or the singleton
  `logger`.
- Add new lib packages to root `tsconfig.json` `references` (not artifacts).
- The OpenAPI `info.title` is `Api`; do not change it (controls codegen paths).
