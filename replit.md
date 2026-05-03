# Alivio Search Cloud

Customer dashboard for the Alivio Search Cloud product — an AI workforce platform
(12 production agents + business assistant) for small businesses.

## Architecture

pnpm monorepo with three runtime artifacts:

- `artifacts/app` — React + Vite customer dashboard **and public marketing
  site**, mounted at `/`. Dark-first premium UI built on shadcn + tailwind v4
  + framer-motion. Uses `@clerk/react` v6 for auth (Replit-managed Clerk
  whitelabel) and `wouter` for routing. Marketing pages live in
  `src/marketing/` (`Home`, `Pricing`, `Agents`, `About`, `Contact`) with a
  shared `MarketingLayout` (sticky header, theme toggle persisted to
  `localStorage` under `alivio-theme`, mobile drawer nav, footer). Public
  routes are `/`, `/pricing`, `/agents`, `/about`, `/contact`. `/agents` is
  dual-purpose: signed-out → marketing page, signed-in → in-app workspace
  inside `AppShell`. `/book-call` and `/install` redirect to `/pricing` until
  the Stripe + Cal.com task wires the real destinations. The four mandated
  CTAs are centralized in `src/marketing/lib/ctas.ts` (`CTA_AUDIT`,
  `CTA_BOOK_CALL`, `CTA_INSTALL`, `CTA_ASSISTANT`) so downstream tasks flip
  hrefs in one place. SEO: per-route title/description/canonical/OG via
  `src/marketing/lib/useSeo.ts`; static fallback meta + JSON-LD
  (`Organization` + `WebSite`) in `index.html`. **Blog**: routes
  `/blog` (index with category chips + search + audit CTAs top/bottom)
  and `/blog/:slug` (article template with H1/byline/reading time,
  Tailwind Typography body, related-posts strip, footer CTA, JSON-LD
  `BlogPosting`). Authoring is markdown files under
  `artifacts/app/content/blog/*.md` with Zod-validated frontmatter
  (`title`, `slug`, `description`, `category`, `publishedAt`, `tags`,
  `ogImage`, optional `author`); the loader in
  `src/marketing/blog/loader.ts` uses `import.meta.glob` to pull every
  post at build time and computes reading time + excerpt.
  `vite.blog-feeds.ts` is a Vite plugin that re-reads the same content
  dir on the Node side and (a) serves `/blog/rss.xml` and `/sitemap.xml`
  via dev/preview middleware and (b) writes the generated XML into
  `dist/public/` at `closeBundle` so the published feed and sitemap
  always include every post. The homepage blog preview block pulls the
  latest 3 from the loader via `src/marketing/lib/blogPosts.ts`.
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
