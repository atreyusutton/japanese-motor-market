# Japanese Motor Market — CLAUDE.md

Free-to-list, free-to-join marketplace for JDM and Japanese-made vehicles in the United States. Site identity: **旧車** (kyūsha). Production domain: `japanesemotormarket.com`.

## Origin

Forked from Classic Motor Market (`../classic-motor-market/classic-motor-market`) in May 2026. The two apps share Cloudflare Images (with JMM uploads tagged `metadata.project = "jmm"` for filterable separation) but nothing else — separate GitHub repo, Neon database, Clerk app, and codebase. The CMM source remains intact and untouched.

## Stack

- **Next.js 16 App Router** + React 19 + Tailwind v4 (no `tailwind.config.ts` — config is inline in `app/globals.css` via `@theme`)
- **Postgres on Neon** via Prisma 6
- **Auth: Clerk** (drop-in replaces NextAuth from CMM). `lib/auth.ts` exposes a NextAuth-shaped `auth()` helper that JIT-creates the DB User row keyed by `clerkId` and adopts seeded users by email match on first sign-in. Middleware lives in `proxy.ts` (not `middleware.ts` — Next 16 convention).
- **Images: Cloudflare Images** (shared CF account with CMM, JMM uploads tagged with metadata)
- **Email: Resend** (transactional only — contact form, future password resets if needed)
- **Deploy: Vercel** (target: `japanesemotormarket.com`)

## Brand identity

- Palette: **Hinomaru red `#BC002D`**, black `#111111`, grey `#6D6D6D`, paper `#FAFAFA`. Tokens defined in `app/globals.css` as `--color-jmm-*`.
- Type: **Oswald** (display) + **Inter** (body) + **Noto Serif JP** (the 旧車 wordmark). Wired via `next/font/google` in `app/layout.tsx`.
- Visual feel: sharp 0–4px corners, 1px borders on cards/photos/galleries. JDM/street, not luxury.

## Key architectural decisions

1. **No payment / membership gating.** All `Stripe`, `MembershipStatus`, `PublishFeeMethod`, `publishFee*`, `placeholder_confirmed`, and the early-access "members-only" placeholder logic from CMM were stripped at the rebrand. Listings are publish-or-draft only. JMM may add optional paid features later (e.g. featured placement) but the core stays free.
2. **User table keyed by `clerkId`.** No password storage, no NextAuth tables. `lib/auth.ts` is the single source of truth for resolving the current user. `session.user.dbId` is the Prisma int ID; `session.user.id` is the same as a string for back-compat with old `parseInt(session.user.id)` call sites.
3. **Usernames are public.** CMM hid them; JMM displays `@username` on listing cards, listing detail seller card, and account pages.
4. **Cloudflare Images metadata tagging.** Every JMM upload carries `{ project: "jmm", source: "seed" | "cover-fix" | "user-upload" }`. CMM uploads are untagged. Use this to filter/clean up in the CF dashboard. Image IDs are unique across both projects so there's zero data-level mixing.
5. **Seed images come from `../japanese-scrapper/`** — a sibling Python project that scrapes BaT's Japanese category listings. The original scraper saved gallery photos but **skipped each listing's `cover_image_url`** (the BaT front-3/4 hero); `scripts/seed-from-scrapper.ts` now fetches that URL and prepends it as the cover. `scripts/fix-cover-images.ts` is the one-shot fixer for legacy seeded data, idempotent via `altText="cover_from_bat"` marker on the new ListingMedia row.

## Repo layout

```
app/
  page.tsx                      # homepage: hero + Reasons-to-join + featured listings
  layout.tsx                    # ClerkProvider wraps {children} INSIDE <body>, fonts, DisclaimerGate
  listings/page.tsx             # full catalog
  listings/[slug]/page.tsx      # listing detail
  sell/page.tsx                 # listing wizard
  sell/[id]/page.tsx            # edit existing listing
  sign-in/[[...sign-in]]/       # Clerk SignIn component
  sign-up/[[...sign-up]]/       # Clerk SignUp component
  account/...                   # listings, watchlist, settings (no billing)
  admin/...                     # users, listings, events, ads (admin-gated)
  blog/                         # scaffold for AI-written JDM blog (model exists, no posts yet)
  api/upload/route.ts           # CF Images upload endpoint (used by sell wizard)

components/
  layout/header.tsx             # top marquee, kanji wordmark, SignedIn/SignedOut, dropdown
  layout/footer.tsx             # JDM marquee, link groups, kanji
  layout/site-container.tsx     # max-width wrapper
  listing/listing-card.tsx      # grid card — shows @username
  listing/listing-wizard.tsx    # 5-step sell flow (no publish fee)
  listing/listing-gallery.tsx   # detail-page gallery
  legal/disclaimer-gate.tsx     # one-time "this is dev" gate
  membership-benefits.tsx       # "Reasons to join" accordion (renamed concept)
  ui/*                          # shadcn-style primitives

lib/
  auth.ts                       # Clerk shim: auth(), requireAuth(), requireAdmin()
  prisma.ts                     # singleton PrismaClient
  utils.ts                      # cn, generateListingSlug, formatCurrency, getCloudflareImageUrl
  validations/listing.ts        # zod schema for listing form

prisma/
  schema.prisma                 # User, Listing, ListingMedia, SavedListing, Ad, Event, BlogPost
  migrations/                   # init migration committed

scripts/
  seed-from-scrapper.ts         # ~100 listings seeded from japanese-scrapper/, cover URL fetched first
  fix-cover-images.ts           # one-shot retroactive cover fixer (idempotent via altText marker)

proxy.ts                        # Clerk middleware (Next 16: proxy.ts not middleware.ts)
.env.local.example              # template for all env vars
```

## Environment variables

All listed in `.env.local.example`. The user's `.env.local` is .gitignored.

- `DATABASE_URL` — Neon Postgres pooled URL (with `?sslmode=require`)
- `NEXT_PUBLIC_APP_URL` — `http://localhost:3000` in dev, `https://japanesemotormarket.com` in prod
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` + `CLERK_SECRET_KEY` — Clerk app keys
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in` etc.
- `CLOUDFLARE_ACCOUNT_ID` — same as CMM (account-level)
- `CLOUDFLARE_API_TOKEN` — JMM-specific token (scope: Account / Cloudflare Images / Edit)
- `NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH` — same as CMM (account-level)
- `RESEND_API_KEY` + `RESEND_FROM_EMAIL` — transactional email

## Common workflows

```bash
# Dev
npm run dev                    # next dev on :3000
npx prisma migrate dev --name <name>  # schema change
npx prisma studio              # browse DB

# Seeding (run from project root; uses ../japanese-scrapper/)
npm run seed:dry               # parse + print, no DB or CF writes
npm run seed                   # full seed: 25 users, ~100 listings, ~1100 images
npm run fix:covers             # retroactively prepend BaT covers (idempotent)

# Deploy
vercel link                    # one-time, links to Vercel project
vercel deploy                  # preview
vercel --prod                  # production
```

## Things that are gotchas, not bugs

- **`tsx` does not auto-load `.env.local`.** Both `prisma.config.ts` and any seed script must `import "dotenv/config"` (or `loadDotenv({ path: ".env.local" })`) at the top. `next dev` and the `prisma` CLI handle this automatically; `npx tsx` does not.
- **`<Show>` from `@clerk/nextjs` does not exist in 6.39.x** despite some docs claiming it replaces `<SignedIn>` / `<SignedOut>`. Use `<SignedIn>` / `<SignedOut>`.
- **Clerk peer dep is narrow.** `@clerk/nextjs@6.39+` requires `react@^18.0.0 || ~19.0.3 || ~19.1.4 || ~19.2.3`. Don't pin react to `19.2.0` exactly — use `^19.2.3`.
- **All BaT scraper entries have `sold_text`** (they're completed auctions). Don't blindly map that to `listingStatus="sold"` — the seed script randomizes 75% active / 20% sold / 5% draft.
- **Title parser** in `seed-from-scrapper.ts` handles a fixed `KNOWN_MAKES` list. New makes (Yamaha, Kawasaki, Datsun, Toyopet, Mitsuoka, Hino added in May 2026) need to be added there. Listings that fail parsing get `null` make/model and may need manual cleanup.

## Open / deferred

- **AI blog pipeline** — `BlogPost` model exists, `app/blog/` is scaffolded, generation isn't wired. Plan: Anthropic API + cron, weekly JDM news posts.
- **Domain wiring** — `japanesemotormarket.com` to point at Vercel, Clerk allowed-origins to include the production domain.
- **Contact form delivery** — `app/contact/page.tsx` currently `console.log`s submissions. Wire to Resend.
- **FAQ / terms / privacy** — rebadged from CMM strings but bodies still have CMM-era flavor in places. Worth a manual rewrite pass.
- **Pagination on /listings** — currently renders all active listings (~127). Will need pagination as listings grow.
