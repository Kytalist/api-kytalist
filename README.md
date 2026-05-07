# api-kytalist

Backend API for the Kytalist project.

## Stack

- **Node.js** + **TypeScript** (ESM, run via [`tsx`](https://github.com/privatenumber/tsx))
- **Express 5** for HTTP
- **Prisma 7** ORM with the `prisma-client` generator
- **PostgreSQL** on **Supabase** (Supavisor pooler for runtime, direct connection for migrations)

## Three-tier layout

| Tier             | Role                                                            | Location                                                                                 |
| ---------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Presentation     | HTTP, routing, CORS, JSON, query parsing, errors → status codes | `src/presentation/` (`createApp.ts`, `routes/`, `middleware/`, `asyncHandler.ts`, `queryUtils.ts`) |
| Service          | Validation, filters, sorting, DTO mapping                       | `src/services/listingService.ts`, `src/services/metaService.ts`                          |
| Data access      | Prisma reads only                                               | `src/repositories/listingRepository.ts`                                                  |
| Infrastructure   | DB connection (pooled `DATABASE_URL`)                           | `src/infrastructure/prisma.ts`                                                           |
| Domain           | Shared errors + API DTO types                                   | `src/domain/`                                                                            |

Entry point stays thin: `src/index.ts` loads env and listens; `createApp()` wires the stack.

## API

- `GET /health` — liveness (unchanged shape).
- `GET /api/v1/meta` — regions, types, cost options, grades, sort options (for the frontend).
- `GET /api/v1/listings` — query params: `category` (`activity` \| `camp` \| `internship` \| `all`), `region`, `type`, `cost`, `grade`, `q`, `sort` (`deadline` \| `alpha` \| `recent`), `limit` (1–500, default 100), `offset`.
- `GET /api/v1/listings/featured` — rows with `featuredOrder` (seed matches the old `featuredListings()` order).
- `GET /api/v1/listings/:id` — single listing; `404` + JSON error if missing.

Errors use `{ error: { message, code } }` via `AppError`.

### Health check

```bash
curl http://localhost:3001/health
# { "status": "ok", "uptime": 12, "timestamp": "..." }
```

## Prerequisites

- Node.js **>= 20.6** (needed for native `--env-file` support and modern ESM)
- **Local:** [Docker](https://docs.docker.com/get-docker/) (for `npx supabase start`) **or** any PostgreSQL for local-only dev
- **Hosted:** a Supabase cloud project (or other Postgres) if you are not using the local stack

## Setup

```bash
git clone https://github.com/Kytalist/api-kytalist.git
cd api-kytalist
npm install
```

### 1. Configure environment

[`.env.example`](.env.example) is pre-filled for **local development** with the same Postgres URL and Supabase API keys that `npx supabase start` uses (public demo JWTs — safe for a local stack only). Copy it to `.env` and start the local Supabase services before migrating:

```bash
cp .env.example .env
npx supabase start
```

**Cloud / production:** replace `DATABASE_URL`, `DIRECT_URL`, and all `SUPABASE_*` values using your Supabase dashboard (**Project Settings → Database → Connection string** for the DB URLs). Use the **pooled** string for `DATABASE_URL` and the **direct** session string for `DIRECT_URL` in production.

**Local overrides (optional):** copy [`.env.local.example`](.env.local.example) to `.env.local`. The app, Prisma CLI, and seed load **`.env` first**, then **`.env.local`** (same key in `.env.local` wins). `.env.local` is gitignored — use it for machine-only URLs or secrets without changing the shared template.

```env
# Typical production shape (values from dashboard — do not use placeholders in real deploys)
# DATABASE_URL=postgres://...pooler...:6543/postgres?pgbouncer=true
# DIRECT_URL=postgres://...db...:5432/postgres
# CORS_ORIGIN=https://your-site.com
# DOCS_ENABLED=false
```

> Why two URLs? Prisma 7 + Supabase requires the pooled URL for app queries (Supavisor pgbouncer in transaction mode) and the direct URL for migrations (which need session-bound connections for advisory locks and DDL transactions). Mixing them causes `prisma migrate` to hang forever. On a dev machine with **local** Postgres you can set both to the same URL, as in `.env.example`.

### 2. Generate the Prisma client and apply migrations

```bash
npx prisma generate            # writes the typed client to ./generated/prisma
npx prisma migrate deploy      # applies committed migrations to the DB
```

Use `migrate deploy` for any environment that doesn't author new migrations (CI, staging, prod, fresh clones). It only applies what's already in `prisma/migrations/`.

### 3. Seed listing data (optional)

```bash
npm run db:seed
```

## Running

```bash
npm run dev      # tsx watch — auto-reloads on file changes
npm start        # one-shot run
npm run build    # type-check + emit declarations via tsc
```

The server listens on `http://localhost:${PORT}` (default `3001`).

## Database

- Prisma model `Listing` (+ enums) in `prisma/schema.prisma`, migration `prisma/migrations/20260506120000_add_listings/`.
- Seed data in `prisma/seed-data.ts` / `prisma/seed.ts` (same ids as the Next app for `#` links).
- `prisma.config.ts` still uses **`DIRECT_URL`** for migrations; the app uses **`DATABASE_URL`** at runtime (pooler-friendly).

### Local vs production

1. **Local:** In `.env`, set `DATABASE_URL` and `DIRECT_URL` to your **local** Postgres (often the same URL for both on a dev box).
2. Run: `npx prisma migrate dev` (or `npm run db:migrate:dev`) when you add migrations; `npm run db:seed` to load listings.
3. **Production:** Point `DIRECT_URL` and `DATABASE_URL` at **prod**; run **`npx prisma migrate deploy`** (`npm run db:migrate:deploy`) — never point prod URLs at a local DB. Then seed if you want the same starter data.

`.env.example` documents `CORS_ORIGIN` (comma-separated). If it is unset, CORS uses reflective `origin: true` for local dev; in production you should set `CORS_ORIGIN` to your real site origins.

### Editing the schema

1. Edit `prisma/schema.prisma`.
2. Create a migration **and** apply it locally:

   ```bash
   npx prisma migrate dev --name <change_summary>
   ```

3. Commit the new folder under `prisma/migrations/`. Production rolls forward with `prisma migrate deploy`.

Other useful commands:

```bash
npx prisma studio                # GUI to inspect/edit DB rows (uses DIRECT_URL)
npx prisma migrate status        # what's applied vs pending
npx prisma format                # format schema.prisma
```

> Never run `prisma migrate dev` against production — it can reset the schema on drift. Production = `prisma migrate deploy` only.

## Project structure

```
.
├── prisma/
│   ├── schema.prisma          # data model
│   ├── seed.ts                # seed runner
│   ├── seed-data.ts           # listing seed rows
│   └── migrations/            # SQL migration history (committed)
├── src/
│   ├── index.ts               # listen + env
│   ├── domain/                # AppError, DTO types
│   ├── infrastructure/      # Prisma / DB pool
│   ├── repositories/          # data access
│   ├── services/              # business logic
│   └── presentation/        # Express app, routes, middleware
├── generated/prisma/          # Prisma Client output (git-ignored, regenerated)
├── prisma.config.ts           # Prisma CLI config — points to DIRECT_URL
├── .env                       # local secrets (git-ignored)
└── .env.example               # template for required env vars
```

`tsconfig.json` includes only `src/**/*.ts` so `tsc` builds the server without pulling in `prisma/`.

## How the DB connection is wired

Prisma 7 dropped `url` / `directUrl` from `schema.prisma`. Connection routing now lives in two places:

| Where                                                       | Reads          | Used for                                         |
| ----------------------------------------------------------- | -------------- | ------------------------------------------------ |
| `prisma.config.ts` → `datasource.url`                       | `DIRECT_URL`   | Prisma CLI: migrate, introspect, db push, studio |
| Application runtime (`PrismaClient` + `@prisma/adapter-pg`) | `DATABASE_URL` | Live queries from the API                        |

If a CLI command stalls on `... at ...:6543`, it means the CLI is hitting the pooler instead of the direct DB — re-check `prisma.config.ts` is reading `DIRECT_URL`.

## Available scripts

| Script                 | Purpose                                      |
| ---------------------- | -------------------------------------------- |
| `npm run dev`          | Start the API with file-watching             |
| `npm start`            | Start the API once                           |
| `npm run build`        | TypeScript build (type-check + emit)         |
| `npm run db:generate`  | `prisma generate`                            |
| `npm run db:migrate:dev` | `prisma migrate dev`                       |
| `npm run db:migrate:deploy` | `prisma migrate deploy`                  |
| `npm run db:seed`      | `tsx prisma/seed.ts`                         |

`package.json` sets `prisma.seed` so `npx prisma db seed` runs the same seed script.

---

**Note:** Keep separate env files or swap `DATABASE_URL` / `DIRECT_URL` before running migrations or seeds so you do not hit production unintentionally. For a strict “local first” workflow, use local Postgres in `.env` until you explicitly promote to prod.

Next steps you might take: hook the Next.js frontend to these endpoints, or add admin write APIs behind authentication.
