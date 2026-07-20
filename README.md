# Sneaker Shelf

A personal digital sneaker shelf — manually track, organize, and value your sneaker collection. Add pairs by hand, upload photos, track purchase/condition/storage/sale details, search and filter your collection, and export the whole thing to a professionally formatted Excel workbook.

This is the first MVP. It intentionally does **not** include AI scanning, barcode/OCR scanning, marketplace integrations (StockX/GOAT/eBay), or a native mobile app — see [Future Phases](#future-phases) for what's deliberately deferred.

## Tech stack

| Concern | Choice |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4, hand-built shadcn/ui-style components (Radix UI primitives) |
| Forms & validation | Native forms + Server Actions, Zod (client *and* server-side validation) |
| Database | SQLite via Prisma ORM (schema written to be Postgres/Supabase-compatible) |
| Auth | Custom email/password auth — bcrypt password hashing + signed JWT session cookie (`jose`) |
| Photo storage | Local disk under `public/uploads`, compressed & thumbnailed with `sharp` |
| Charts | Recharts |
| Excel export | ExcelJS (real `.xlsx`, not a renamed CSV) |
| Tests | Vitest |

## Getting started (local development)

```bash
npm install
npm run setup    # creates .env, builds the SQLite DB, seeds 14 demo sneakers
npm run dev
```

(`npm run setup` is idempotent — it never overwrites an existing `.env`, and re-running it just re-applies migrations and refreshes the seed data. The manual equivalent is `cp .env.example .env && npx prisma migrate deploy && npm run db:seed`.)

Open http://localhost:3000. Sign in with the seeded demo account:

- **Email:** `demo@sneakershelf.app`
- **Password:** `Password123!`

Or click "Create one" on the login page to register your own account — every account only ever sees its own inventory, photos, tags, and storage locations.

### Environment variables

See `.env.example`:

- `DATABASE_URL` — SQLite connection string for local dev (`file:./dev.db`). Point this at a PostgreSQL/Supabase connection string in production (see [Deployment](#deployment)).
- `SESSION_SECRET` — random string used to sign session cookies. Generate one with `openssl rand -base64 32`.

### Running tests

```bash
npm test
```

Covers the pure business-logic layer that's cheapest and highest-value to unit test: acquisition-cost/net-proceeds/profit-loss math and the sneaker form's Zod validation rules (required fields, non-negative prices, condition-score bounds, sale-date-after-purchase-date, sale fields required only when status is Sold).

For UI/flow verification, this app was driven end-to-end with a headless browser (login → add sneaker with photos → gallery/table views → duplicate detection → mark for sale/sold → delete confirmation → dashboard charts in light/dark mode → mobile nav → Excel export) rather than relying on unit tests alone — see [Folder structure](#folder-structure) for where to add Playwright specs if you want to automate that too.

## Primary workflow

1. Sign in (or register).
2. **Add Sneaker** → fill in Basic/Size/Inventory/Purchase/Value info, optionally drag-and-drop photos, save.
3. If a pair with the same style code + size already exists, you're prompted to add it as a separate pair, increase quantity on the existing record, update the existing record, or cancel.
4. View the collection as a photo **gallery** or a sortable **table** — toggle persists across visits.
5. Search and filter (brand, size, condition, status, storage, price/value range, purchase year, box included, authentication, and more), then **Clear Filters**.
6. Open a sneaker's **detail page** to edit, duplicate, mark for sale/sold, archive, or delete (with confirmation).
7. **Sold** page tracks completed sales and realized profit/loss separately from active inventory; sales can be reopened to correct mistakes.
8. **Download Excel** from the Dashboard, Collection, or Import/Export page — exports either the full inventory or just your current filtered view.

## Folder structure

```
prisma/
  schema.prisma          # Data model (see below)
  seed.ts                 # Demo data generator (14 sneakers, synthetic photos)
  migrations/             # Prisma migration history

src/
  app/
    (auth)/               # login, register, forgot/reset password — no sidebar
    (app)/                # everything behind auth, wrapped in the sidebar/topbar shell
      dashboard/
      collection/         # "My Collection" — gallery + table views
      sneakers/add/
      sneakers/[id]/            # detail page
      sneakers/[id]/edit/
      sold/
      import-export/
      settings/
    api/
      export/route.ts    # GET .xlsx download (?ids=a,b,c for a filtered export)

  components/
    ui/                   # hand-built Button/Input/Select/Dialog/etc. (Radix + Tailwind)
    layout/               # Sidebar, mobile nav (portaled), topbar, theme toggle
    sneakers/             # SneakerForm, PhotoUploader, gallery/table, duplicate modal, status badges
    dashboard/            # Chart wrappers (Recharts), stat cards
    settings/             # Profile/password/storage-location forms

  lib/
    actions/              # Server Actions: auth.ts, sneakers.ts, settings.ts, import.ts
    validation/           # Zod schemas (auth, sneaker form, photo metadata)
    db.ts                 # Prisma client singleton
    session.ts            # JWT session cookie helpers
    password.ts            # bcrypt helpers
    calculations.ts        # totalAcquisitionCost / netProceeds / profitOrLoss (unit tested)
    excel-export.ts        # ExcelJS workbook builder (5 worksheets)
    photo-storage.ts       # sharp-based compression + local disk storage
    duplicate-detection.ts # style code + size + size system + size category matching
    inventory-number.ts    # SNK-000001-style auto-numbering
    constants.ts           # Brand/category/condition/status enums + labels used everywhere
  __tests__/               # (inside lib/) Vitest specs

  middleware / proxy.ts    # Route protection (Next 16 renamed "middleware" to "proxy")

public/
  uploads/                # User-uploaded photos (gitignored; created at runtime)
  placeholders/           # Sneaker placeholder SVG shown when no photo is uploaded
```

## Data model

`users → sneaker_products → inventory_items → { sneaker_photos, purchase_records, sale_records, inventory_tags → tags }`, plus `storage_locations` per user.

- A **sneaker product** is the general release (brand, name, colorway, style code, retail price, …).
- An **inventory item** is one physical pair you own, referencing a product — this is where size, condition, status, purchase/value/sale info, and photos live. Multiple inventory items can point at the same product (e.g. two pairs of the same Dunk in different sizes, or a genuine duplicate pair).

SQLite has no native enum type, so conceptually-enum columns (`condition`, `status`, `sizeSystem`, etc.) are stored as `String` and validated in the Zod layer (`src/lib/validation`, `src/lib/constants.ts`). When migrating to PostgreSQL these can be promoted to native Prisma enums without changing the data shape — see [Deployment](#deployment).

## Authentication & security

- Email/password registration and sign-in; passwords hashed with bcrypt.
- Sessions are a signed JWT (HS256, `jose`) in an `httpOnly`, `sameSite=lax` cookie — verified in `proxy.ts` (Next's renamed Middleware) before any protected route renders, and again server-side in every Server Action via `requireSession()`.
- Password reset generates a one-hour token; since this MVP has no outbound email provider wired up, the reset link is surfaced directly in the UI instead of emailed (see the "Forgot password" page) — swap in Resend/Postmark/etc. and email it in `requestPasswordResetAction` for production use.
- All Prisma queries for inventory/photos/products/tags/storage locations are scoped by `userId`, so one account can never read or write another's data.
- Uploaded photos are validated by MIME type and size, re-encoded (not just renamed) via `sharp` before being written to disk under a per-user directory with a generated filename (never the original filename), and compressed with a thumbnail generated alongside the full image.
- All mutations run through Zod on the server regardless of what client-side `required`/`min`/`max` attributes already caught.

## Excel export

`GET /api/export` (optionally `?ids=id1,id2,...` for a filtered export) streams back a real `.xlsx` (ExcelJS, not a CSV) named `Sneaker_Shelf_Inventory_<date>.xlsx` with five worksheets:

1. **Inventory** — every physical pair, all 51 columns from the spec (purchase, value, sale, calculated totals, etc.)
2. **Active Collection** — excludes Sold/Traded/Gifted/Returned/Archived
3. **Sold Sneakers** — completed sales and their financials
4. **Collection Summary** — totals, unrealized/realized P&L, counts by brand/condition/status
5. **Storage Summary** — pairs/cost/value grouped by storage location

Every sheet has a bold header row, frozen header, autofilter, currency/date number formats, and alternating row shading; the top of each sheet also states the app name, generation date, and export scope (all vs. filtered).

## Excel import

A minimal, working import already exists (`src/lib/actions/import.ts`, wired into the Import/Export page): upload a `.xlsx` using the same column headers this app exports, and it validates required fields per row, skips likely duplicates (same style code + size), creates the rest, and lets you download a CSV error report for anything that failed.

The fuller wizard described in the product spec — upload → preview → interactive column mapping → per-field validation UI → duplicate resolution UI → import → error report — is intentionally *not* fully built yet (the spec explicitly deprioritizes import relative to export for this MVP). The architecture is ready for it: `HEADER_MAP` in `import.ts` is where column mapping would become configurable, and `findPossibleDuplicate` (already used by the manual Add/Edit flow) is reused as-is for duplicate detection.

## Deployment

1. **Database:** provision PostgreSQL (Supabase or otherwise). Update `DATABASE_URL` and change `provider = "sqlite"` to `provider = "postgresql"` in `prisma/schema.prisma`, then `npx prisma migrate deploy`. At that point, promote the String "enum" columns listed in `schema.prisma`'s comments to native Prisma `enum` types if you'd like stricter DB-level constraints (optional — the Zod layer already enforces them at the application boundary).
2. **Photo storage:** local disk storage under `public/uploads` won't survive redeploys on most serverless hosts. Swap `src/lib/photo-storage.ts`'s `storePhoto`/`deletePhotoFiles` for Supabase Storage (or S3-compatible) upload/delete calls — the rest of the app only depends on `fileUrl`/`thumbnailUrl` being fetchable URLs, so no other code needs to change.
3. **Session secret:** set a strong, unique `SESSION_SECRET` in your host's environment variables (never reuse the `.env.example` placeholder).
4. **Build & run:** `npm run build && npm run start`, or deploy directly to Vercel (the stack is a stock Next.js App Router project — no custom server).
5. If you move to Supabase, consider enabling **Row Level Security** policies mirroring the `userId` scoping already enforced in application code, as defense in depth.

## Future phases (explicitly out of scope for this MVP)

Barcode/box-label/size-tag scanning, OCR, AI photo identification, a native mobile camera workflow, bulk scanning, native iOS/Android apps, StockX/GOAT/eBay integrations and automatic market valuation, wear tracking, wishlist price alerts, public collection sharing, QR-code storage management. The data model (separate `SneakerProduct` vs. `InventoryItem`, a dedicated `SaleRecord`/`PurchaseRecord`, manually-entered valuation fields) is deliberately shaped so these can be layered on without a rewrite.
