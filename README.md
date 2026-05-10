# api-kytalist

Backend API for the Kytalist project.

## Stack

- **Node.js** + **TypeScript** (ESM, run via [`tsx`](https://github.com/privatenumber/tsx))
- **Express 5** for HTTP
- **Prisma 7** ORM with the `prisma-client` generator
- **PostgreSQL** (Supabase, Neon, Railway, or any Postgres host)

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

- Admin-only: `POST /api/v1/admin/uploads/listing-image` — request body: `{ filename: string, contentType: string }`. Returns a `SignedUpload` object with `{ path, uploadUrl, publicUrl, token }` which the client uses to perform the file upload. This endpoint is mounted under the admin router and requires a bearer token for an admin user.

Errors use `{ error: { message, code } }` via `AppError`.

### Health check

```bash
curl http://localhost:3001/health
# { "status": "ok", "uptime": 12, "timestamp": "..." }
```

## Prerequisites

- Node.js **>= 20.6**
- A hosted PostgreSQL database:
  - [Supabase](https://supabase.com) (recommended - includes auth + storage)
  - [Neon](https://neon.tech) (serverless Postgres)
  - [Railway](https://railway.app) or [Render](https://render.com)
  - Any other PostgreSQL host

## Setup

```bash
git clone https://github.com/Kytalist/api-kytalist.git
cd api-kytalist
npm install
```

### 1. Create a hosted database

**Using Supabase (recommended):**
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the database to provision (~2 minutes)
3. Go to **Project Settings → Database**
4. Copy both connection strings:
   - **Connection pooling** (port 6543) → use for `DATABASE_URL`
   - **Session mode** (port 5432) → use for `DIRECT_URL`

**Using Neon or other providers:**
- For Neon, get the connection string from your dashboard
- Most providers give you a single URL - use it for both `DATABASE_URL` and `DIRECT_URL`

### 2. Configure environment

Copy `.env.example` to `.env` and fill in your database credentials:

```bash
cp .env.example .env
```

Update `.env` with your values:

```env
# From your Supabase dashboard:
DATABASE_URL=postgresql://postgres.[your-ref]:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.[your-ref]:5432/postgres

# If using Supabase Auth + Storage:
SUPABASE_URL=https://[your-ref].supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
SUPABASE_JWT_SECRET=your-jwt-secret
SUPABASE_STORAGE_BUCKET=listing-images

# Optional:
PORT=3001
CORS_ORIGIN=http://localhost:3000
DOCS_ENABLED=true
```

Notes on the storage bucket env var

- The server looks for `SUPABASE_STORAGE_BUCKET`. If not set, the code currently defaults to `listing-images`.
- Make sure the named bucket exists in your Supabase project's Storage panel.
- If the bucket is private, the `publicUrl` returned by the API may not be directly accessible; you can rely on signed URLs or make the bucket public depending on your needs.

> **Why two DB URLs?** Prisma requires:
> - **`DATABASE_URL`** (pooled) for runtime queries - uses connection pooling for better performance
> - **`DIRECT_URL`** (session) for migrations - needs session-based connection for DDL operations
> 
> If your provider doesn't use pooling (e.g., Neon), use the same URL for both.

### 3. Run migrations and seed data

```bash
npm run db:generate       # Generate Prisma client
npm run db:migrate:deploy # Apply migrations to your database
npm run db:seed          # Load sample data (optional)
```

## Running

```bash
npm run dev      # tsx watch — auto-reloads on file changes
npm start        # one-shot run
npm run build    # type-check + emit declarations via tsc
```

The server listens on `http://localhost:${PORT}` (default `3001`).

## File uploads (current behavior)

This project exposes an admin-only helper to create signed upload URLs for listing images:

- Endpoint: `POST /api/v1/admin/uploads/listing-image`
- Auth: requires a bearer token for an admin user (the admin router enforces role `admin`)
- Body: `{ "filename": "photo.jpg", "contentType": "image/jpeg" }`
- Response: `{ "path": "listings/2026/<uuid>.jpg", "uploadUrl": "...", "publicUrl": "...", "token": "..." }`

Allowed content types (validated server-side):

- `image/jpeg`
- `image/png`
- `image/webp`
- `image/gif`
- `image/svg+xml`
- `image/avif`

Typical usage flow:

1. Admin client requests a signed upload URL from the API (`POST /api/v1/admin/uploads/listing-image`) with the filename + content type.
2. The API creates a server-chosen path (`listings/<year>/<uuid>.<ext>`) and calls Supabase to create a one-shot signed upload URL.
3. The client uploads the binary directly to the returned `uploadUrl` (make sure to set the same `Content-Type`). Example (from a JS client, or via `curl`):

```bash
# Request a signed upload URL (replace AUTH_TOKEN and host)
curl -H "Authorization: Bearer AUTH_TOKEN" -H "Content-Type: application/json" \
  -d '{"filename":"photo.jpg","contentType":"image/jpeg"}' \
  https://api.example.com/api/v1/admin/uploads/listing-image

# Upload the file to the signed URL that the API returned
curl -X PUT --upload-file ./photo.jpg -H "Content-Type: image/jpeg" "<uploadUrl>"
```

4. The API response includes a `publicUrl` (which will be accessible if the bucket/object ACL allows it).

## Database

- Prisma model `Listing` (+ enums) in `prisma/schema.prisma`, migration `prisma/migrations/20260506120000_add_listings/`.
- Seed data in `prisma/seed-data.ts` / `prisma/seed.ts` (same ids as the Next app for `#` links).
- `prisma.config.ts` still uses **`DIRECT_URL`** for migrations; the app uses **`DATABASE_URL`** at runtime (pooler-friendly).

### Development vs Production

**Development:**
- Create a separate Supabase project for development
- Use `npm run db:migrate:dev` when creating new migrations
- Seed with sample data using `npm run db:seed`

**Production:**
- Use `npm run db:migrate:deploy` to apply migrations
- Set `CORS_ORIGIN` to your actual frontend URL(s) (comma-separated)
- Set `DOCS_ENABLED=false` to disable API documentation

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

> ⚠️ **Never** run `prisma migrate dev` against production — it can reset data on schema drift. Always use `prisma migrate deploy` in production.

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

**Best Practice:** Use separate Supabase projects (or database instances) for development and production. Never point your development environment at production data.

Next steps you might take: hook the Next.js frontend to these endpoints, or add admin write APIs behind authentication.
