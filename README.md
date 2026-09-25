# Wanderly

**Group trip planning, in one place.** Wanderly helps a group of friends plan a trip together: shared itineraries, budgets, expenses that split themselves, and real-time updates for everyone in the group.

## Features

- **Groups**: create a group, invite people with a 6-character code or invite link, assign tasks to members.
- **Trips**: multiple trips per group with dates, location and a status (planning, finalized, ongoing, cancelled).
- **Itinerary**: activities with times, notes and transport details, shown as a day overview, a timeline and a calendar. Mark activities done; export the schedule as a PNG or an `.ics` calendar file.
- **Budgets**: plan spending per trip and per activity and mark what is already booked.
- **Expenses**: record who paid, split costs across members (including non-registered guests), attach a payment method and QR code, and track who has paid and who still owes. Charts summarise spending.
- **Payments**: members mark themselves paid, the payer confirms, and every settlement lands in a payment history.
- **Guest view**: share a group code to give someone read-only access without an account.
- **Notifications**: in-app notifications plus real-time updates over Socket.IO.
- **Onboarding**: a first-run wizard, with a sample trip so new accounts have something to explore.
- **Admin portal**: user management, app configuration ("What's new"), and database and storage usage.

## Tech stack

| Area | Tools |
|---|---|
| Framework | Next.js 15 (App Router, Turbopack), React 19, TypeScript |
| UI | Tailwind CSS 4, shadcn/ui (Radix), Framer Motion, Lucide icons, Recharts, Sonner toasts |
| Data | PostgreSQL with Prisma 6 |
| Client state | TanStack Query, React Hook Form, Zod |
| Auth | Firebase Authentication (client) and Firebase Admin (server token verification) |
| Storage | Cloudinary (avatars and payment QR codes) |
| Realtime | Socket.IO client, talking to a separate socket server |
| Tests | Vitest |

## Getting started

**Prerequisites:** Node.js 22.12 or newer (`.nvmrc` pins it), a PostgreSQL database, a Firebase project with Email/Password authentication, and a Cloudinary account.

```bash
git clone <repository-url>
cd travelscheduleapp
npm install
```

Create a `.env` file in the repo root with the variables below, then set up the database and start the dev server:

```bash
npm run db:generate
npm run db:migrate     # applies migrations to the database in DATABASE_URL
npm run dev            # http://localhost:3000
```

### Environment variables

`.env` is gitignored; never commit real values. Anything read in the browser must be `NEXT_PUBLIC_`-prefixed.

| Group | Variables |
|---|---|
| Database | `DATABASE_URL`, `DATABASE_URL_UNPOOLED` |
| Firebase (client) | `NEXT_PUBLIC_FIREBASE_API_KEY`, `..._AUTH_DOMAIN`, `..._PROJECT_ID`, `..._STORAGE_BUCKET`, `..._MESSAGING_SENDER_ID`, `..._APP_ID`, `..._MEASUREMENT_ID` |
| Firebase Admin (server) | `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` |
| Cloudinary | `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` |
| Realtime | `NEXT_PUBLIC_SOCKET_URL`, `SOCKET_API_KEY` |
| Admin | `ADMIN_PASSWORD` |
| App flags | `NEXT_PUBLIC_ENVIRONMENT`, `NEXT_PUBLIC_MAINTENANCE_MODE` |

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server (Turbopack) |
| `npm run build` | Production build: `prisma generate`, `prisma migrate deploy`, `next build` |
| `npm run build:ci` | Same without the migration step (what CI runs) |
| `npm start` | Start the production server |
| `npm run lint` | ESLint |
| `npm test` / `npm run test:watch` | Vitest (colocated `*.test.ts` files) |
| `npm run db:generate` / `db:migrate` / `db:studio` | Prisma client, migrations, and the Prisma Studio GUI |

Every pull request runs lint, tests and a CI build (`.github/workflows/checks.yml`).

## How the code is organised

- `src/app`: routes and API routes (`src/app/api/**/route.ts`). Each API feature follows the same layering: a thin `route.ts`, a `services.ts` with the business rules, a `repository.ts` that is the only file talking to Prisma, and a `schemas.ts` with the Zod request schemas.
- `src/app/components`: page-level and shared React components. `src/hooks`: TanStack Query hooks. `src/shared/types`: shared types.
- `components/ui` and `lib/` at the repo root: shadcn/ui primitives and shared singletons and utilities (Prisma client, Firebase, Axios, logger, auth wrappers).
- `prisma`: schema and migrations. `scripts`: one-off maintenance scripts. `docs/superpowers`: design specs and implementation plans.

Conventions and architecture rules for contributors (and coding agents) are in [`CLAUDE.md`](./CLAUDE.md).

## Deployment

The app is deployed on Vercel. The build runs `prisma migrate deploy`, so the deployment environment needs `DATABASE_URL` and the other variables above. Work merges into `dev`; a GitHub workflow keeps a `dev` to `prod` pull request open, and merging that one deploys to production.

## License

Private and proprietary.
