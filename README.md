# 🎯 Goal Dashboard

Real-time revenue tracking dashboard for teams. Set a goal, watch your progress on a big screen.

## Features

- **Goal-driven** — Set monthly/quarterly revenue targets
- **Multi-bank** — Aggregate data from multiple Russian banks (Точка, Т-Банк)
- **Real-time** — Auto-refresh every minute
- **TV-optimized** — Large, readable numbers for office projectors
- **Progress tracking** — Visual progress bar with pace indicator
- **Forecasting** — Predict goal completion date based on current pace

## Tech Stack

- **Framework:** Next.js 14 (App Router + API Routes)
- **Database:** PostgreSQL + Prisma
- **Styling:** Tailwind CSS
- **Bank APIs:** Точка Open API, Т-Банк T-API

## Quick Start

```bash
# Clone
git clone https://github.com/CroissanStudioDev/goal-dashboard.git
cd goal-dashboard

# Install
pnpm install

# Setup database
cp .env.example .env.local
# Edit .env.local with your database URL
pnpm db:push

# Run
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

## API Routes

### Goals
- `GET /api/goals` — List all active goals
- `POST /api/goals` — Create new goal
- `GET /api/goals/[id]` — Get goal with progress
- `GET /api/goals/[id]/stats` — Get today/yesterday stats
- `DELETE /api/goals/[id]` — Deactivate goal

### Bank Accounts
- `GET /api/accounts` — List connected accounts
- `GET /api/accounts/[id]` — Get account details
- `DELETE /api/accounts/[id]` — Disconnect account

### Auth
- `GET /api/auth/tochka` — Start Точка OAuth flow
- `GET /api/auth/tochka/callback` — OAuth callback
- `POST /api/auth/tbank` — Connect Т-Банк with token

### Sync
- `POST /api/sync` — Trigger transaction sync (call via cron)

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/goal_dashboard

# Точка Bank (OAuth 2.0)
TOCHKA_CLIENT_ID=
TOCHKA_CLIENT_SECRET=
TOCHKA_REDIRECT_URI=http://localhost:3000/api/auth/tochka/callback

# Т-Банк (Token)
# Token is stored per-account in database

# Sync protection
CRON_SECRET=your_secret_here
```

## Bank Setup

<details>
<summary>Точка Bank</summary>

1. Go to Internet Bank → Integrations & API → Connect
2. Register OAuth 2.0 application
3. Select permissions: `ReadAccountsBasic`, `ReadAccountsDetail`, `ReadBalances`, `ReadStatements`
4. Copy `client_id` and `client_secret` to `.env.local`

[Full documentation](https://developers.tochka.com/docs/tochka-api)
</details>

<details>
<summary>Т-Банк (Tinkoff Business)</summary>

1. Go to Services → Integrations → API Integration → Connect
2. Issue token with required permissions
3. Call `POST /api/auth/tbank` with your token

[Full documentation](https://developer.tbank.ru/docs/api/)
</details>

## Cron Setup

Set up a cron job to sync transactions periodically:

```bash
# Every 15 minutes
*/15 * * * * curl -X POST https://your-domain/api/sync -H "Authorization: Bearer $CRON_SECRET"
```

Or use Vercel Cron, Railway Cron, etc.

## License

MIT © Croissan Studio
