# replit.md

## Overview

**Mine Invest / StockWatcher** is a personal investment portfolio tracker for Thai and international assets. The app allows users to track multiple asset classes including:

- **Thai stocks** (SET-listed equities)
- **US stocks** (NYSE/NASDAQ equities and ETFs)
- **Thai mutual funds** (กองทุนรวม)
- **Bonds** (หุ้นกู้)
- **Crypto** (via Bitkub exchange)

Key features include real-time price syncing from Yahoo Finance and Bitkub APIs, dividend tracking, transaction history with undo support, a pull-to-refresh mechanic on mobile, and an area chart visualization of portfolio performance.

The app is a full-stack TypeScript monorepo with a React frontend and Express backend, connected to a PostgreSQL database via Drizzle ORM. Primary portfolio state is managed client-side (localStorage via a custom `usePortfolio` hook), while the database stores portfolio snapshots.

---

## User Preferences

Preferred communication style: Simple, everyday language.

---

## System Architecture

### Frontend Architecture

- **Framework**: React 18 with TypeScript, bundled by Vite
- **Routing**: `wouter` (lightweight client-side router)
- **State Management**:
  - Server state: TanStack Query (React Query v5) for API data fetching, caching, and mutation
  - Portfolio state: Custom `usePortfolio` hook backed by `localStorage` — this is the primary state store for holdings, transactions, and prices
  - Undo system: `UndoContext` (React Context) holds a stack of up to 20 undoable actions
- **UI Components**: shadcn/ui (New York style) built on top of Radix UI primitives, styled with Tailwind CSS
- **Animations**: Framer Motion for page transitions, pull-to-refresh indicator, and list animations
- **Charts**: Recharts (`AreaChart`) for portfolio value visualization
- **Forms**: React Hook Form + Zod validation via `@hookform/resolvers`
- **Path aliases**: `@/` → `client/src/`, `@shared/` → `shared/`

**Pages:**
- `/` → `client/src/pages/dashboard.tsx` — main portfolio overview with tabs (summary, stocks, US stocks, funds, bonds, crypto, dividends, history)
- `/investments/:id` → `InvestmentDetails.tsx` — drill-down per investment with transactions and dividends
- `*` → `not-found.tsx`

**Key Client Hooks:**
| Hook | Purpose |
|---|---|
| `use-portfolio.ts` | Core portfolio state (localStorage), computed values, CRUD mutations |
| `use-market-data.ts` | SET index and crypto prices via backend API |
| `use-pull-to-refresh.ts` | Native touch event pull-to-refresh |
| `use-investments.ts` | TanStack Query wrappers for investment CRUD |
| `use-transactions.ts` | TanStack Query wrappers for transaction CRUD |
| `use-dividends.ts` | TanStack Query wrappers for dividend CRUD |

### Backend Architecture

- **Runtime**: Node.js with TypeScript via `tsx`
- **Framework**: Express 5
- **Entry point**: `server/index.ts` → registers routes → serves Vite dev middleware (dev) or static build (prod)
- **API Layer**: Routes defined in `server/routes.ts`, typed contracts shared via `shared/routes.ts` using Zod schemas
- **Storage Layer**: `server/storage.ts` — `DatabaseStorage` class implementing `IStorage` interface; uses Drizzle ORM queries against PostgreSQL
- **Build**: `script/build.ts` — runs Vite for the client, then esbuild for the server (bundled CJS with allowlist of deps to include)

**API Endpoints (from `shared/routes.ts` and `server/routes.ts`):**
| Endpoint | Description |
|---|---|
| `GET /api/set-index` | Fetches Thai SET index price from Yahoo Finance |
| `GET /api/fx-rate` | Fetches USD/THB exchange rate |
| `GET /api/us-stock/:symbol` | Fetches US stock price from Yahoo Finance |
| `GET /api/crypto/prices` | Fetches all crypto prices from Bitkub |
| `GET /api/stock/:symbol` | Fetches Thai stock price |
| `GET /api/stock/:symbol/dividends` | Fetches dividend data for Thai stocks |
| `GET /api/cloud/fetch` | Server-side proxy: fetches all rows from Google Apps Script (GAS) spreadsheet |
| `POST /api/cloud/sync` | Server-side proxy: sends a single transaction to GAS for persistence |
| Investment/Transaction/Dividend CRUD | Full REST endpoints for DB-backed entities |

**Cloud Sync (Google Sheets)**: Portfolio data can be synced to a Google Apps Script (GAS) spreadsheet for cross-device persistence. The client calls `/api/cloud/fetch` and `/api/cloud/sync` (Express server-side proxies) to avoid CORS issues from the browser directly calling `script.google.com`. The GAS URL is hardcoded in `server/routes.ts`. Sheet columns: `[ID, Date, Symbol, Type, Price, Qty, Amount, Note, AssetType]`. Client-side `syncAllToCloud()` function sends all local transactions sequentially with 200ms delay between rows.

**External price fetching strategy**: The server uses Node's native `https` module (no axios) to directly call Yahoo Finance (`query1.finance.yahoo.com`) and Bitkub (`api.bitkub.com`) APIs, acting as a proxy to avoid CORS issues on the client.

### Data Storage

- **Database**: PostgreSQL via `node-postgres` (`pg`) connection pool
- **ORM**: Drizzle ORM with `drizzle-kit` for migrations
- **Schema** (`shared/schema.ts`):
  - `portfolios` table — stores portfolio name and serialized state (text blob); serves as a lightweight persistence layer for the localStorage-first portfolio state
  - Additional tables for investments, investment types, transactions, and dividends are implied by the hooks and forms but not shown in the provided schema file — these may need to be added
- **Config**: `drizzle.config.ts` targets `./shared/schema.ts`, outputs migrations to `./migrations/`, requires `DATABASE_URL` env variable
- **Migration command**: `npm run db:push` (drizzle-kit push)

### Authentication

No authentication system is present in the current codebase. The app is designed as a single-user personal tracker.

### Mobile Support

- Responsive design via Tailwind breakpoints
- Pull-to-refresh implemented with native touch events (`use-pull-to-refresh.ts`)
- PWA-ready (manifest and service worker present in attached assets, indicating the original design supported installable PWA)
- Mobile breakpoint: 768px (`use-mobile.tsx`)

---

## External Dependencies

### Third-Party APIs

| Service | Usage | Auth |
|---|---|---|
| **Yahoo Finance** (`query1.finance.yahoo.com`) | SET index, Thai stocks, US stocks, FX rates | None (scraping via User-Agent header) |
| **Bitkub** (`api.bitkub.com/api/market/ticker`) | Crypto prices in THB | None (public API) |
| **Google Fonts** | DM Sans, Outfit, Fira Code, Geist Mono, Architects Daughter | None |

### Key npm Packages

| Package | Purpose |
|---|---|
| `express` v5 | Backend HTTP server |
| `drizzle-orm` + `drizzle-kit` | ORM and migrations |
| `pg` + `connect-pg-simple` | PostgreSQL driver and session store |
| `@tanstack/react-query` v5 | Server state management |
| `wouter` | Client-side routing |
| `framer-motion` | Animations and transitions |
| `recharts` | Portfolio charts |
| `react-hook-form` + `zod` | Form validation |
| `shadcn/ui` (Radix UI) | UI component library |
| `tailwindcss` | Utility-first CSS |
| `date-fns` | Date formatting (only used in orphan files; removed from main bundle) |
| `vite` + `@vitejs/plugin-react` | Frontend bundler |
| `tsx` | TypeScript runner for dev/build scripts |
| `esbuild` | Server bundler for production |
| `nanoid` | Unique ID generation |

### Environment Variables Required

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (required at startup) |
| `NODE_ENV` | `development` or `production` |
| `REPL_ID` | Auto-set by Replit; enables dev-only plugins (cartographer, dev-banner, error overlay) |

---

## Netlify Deployment

The app deploys to Netlify as a **static SPA + Netlify Functions** setup.

### Files
| File | Purpose |
|---|---|
| `netlify.toml` | Build command, publish dir (`dist/public`), redirects, NODE_VERSION |
| `netlify/functions/api.js` | Serverless function proxying Yahoo Finance, Bitkub, and FX rate APIs |

### Deployment steps (CLI, no GitHub required)
```bash
npx vite build              # builds to dist/public
netlify deploy --prod       # deploys dist/public to production
```

### Important: Production-only plugin guard in vite.config.ts
`runtimeErrorOverlay()` is guarded by BOTH `REPL_ID !== undefined` AND `NODE_ENV !== 'production'`.  
This ensures the plugin (which connects to Replit's WebSocket) is **never included in the production bundle**, whether built locally on Replit or on Netlify's CI.

### Known API limitations
- Thai mutual fund prices (`/api/fund/*`) are not available via Yahoo Finance — funds retain their manually-entered seed prices.
- Thai stock dividends may return empty arrays depending on Yahoo Finance data availability.