# MineInvest - Thai Investment Portfolio Tracker

## Overview
Thai-language investment portfolio tracker supporting Thai stocks (SET), US stocks, cryptocurrency (Bitkub), and mutual funds. Displays real-time prices with dual-currency (THB + USD) support and auto-refreshes every 10 seconds.

## Architecture
- **Frontend**: React + Vite + TailwindCSS + shadcn/ui (client/)
- **Backend**: Express.js with TypeScript (server/)
- **Database**: PostgreSQL via Drizzle ORM (shared/schema.ts)
- **State**: Portfolio state persisted in PostgreSQL `portfolio_state` table; localStorage used as fast-load cache

## Key Features
- Real-time prices: Thai stocks via Yahoo Finance (.BK suffix), US stocks via Yahoo Finance, crypto via Bitkub API
- SET Index widget with live updates
- Dual currency: THB + USD (with live FX rate)
- Separated dividend/interest summary page
- Auto-refresh every 10 seconds
- Persistent storage in PostgreSQL (state saved with 1.5s debounce)

## API Endpoints
- `GET /api/set-index` — SET Index price
- `GET /api/fx-rate` — THB/USD exchange rate
- `GET /api/stock/:symbol` — Thai stock price (appends .BK)
- `GET /api/us-stock/:symbol` — US stock price
- `GET /api/fund/:symbol` — Thai fund price (via Yahoo Finance .BK)
- `GET /api/crypto/prices` — All Bitkub THB pairs
- `GET /api/stock/:symbol/dividends` — Stock dividends for current year
- `GET /api/portfolio-state` — Load saved portfolio from DB
- `POST /api/portfolio-state` — Save portfolio to DB

## Netlify Deployment

### Files
- `netlify.toml` — Build config, function routing, SPA redirects
- `netlify/functions/api.ts` — Express app wrapped with serverless-http
- `netlify/functions/tsconfig.json` — TypeScript config for esbuild bundler

### How it works
- Frontend: `npx vite build` → `dist/public/` (static files)
- Backend: Netlify Functions (serverless), esbuild bundles TypeScript + path aliases
- `/api/*` requests → redirected to `/.netlify/functions/api`
- `/*` requests → `index.html` (SPA routing)

### Required Environment Variables on Netlify
- `DATABASE_URL` — External PostgreSQL connection string (e.g., from Neon.tech, Supabase, or Railway)

### Deploying to Netlify
1. Push code to GitHub
2. Connect repo to Netlify
3. Set `DATABASE_URL` environment variable in Netlify → Site Settings → Environment Variables
4. Run `npm run db:push` against the external DB to create tables
5. Deploy — Netlify auto-runs `npx vite build` and bundles functions

## Development (Replit)
- Workflow: `npm run dev` → starts Express + Vite on port 5000
- Database: Replit's built-in PostgreSQL (DATABASE_URL auto-set)
- Run `npm run db:push` to sync schema changes
