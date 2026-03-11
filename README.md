# 🎯 Goal Dashboard

Real-time revenue tracking dashboard for teams. Set a goal, watch your progress on a big screen.

![Dashboard](https://img.shields.io/badge/Next.js-14-black)
![Database](https://img.shields.io/badge/Drizzle-ORM-green)
![License](https://img.shields.io/badge/License-MIT-blue)

## Features

- **Goal-driven** — Set monthly/quarterly revenue targets
- **Multi-bank** — Aggregate data from Russian banks (Точка, Т-Банк)
- **Real-time** — Auto-refresh every 30-60 seconds
- **TV Mode** — Fullscreen mode optimized for office projectors
- **Progress tracking** — Visual progress bar with pace indicator
- **Forecasting** — Predict goal completion date based on current pace
- **Manual entry** — Add transactions manually if needed

## Screenshots

### Dashboard
Large readable numbers, progress bar, pace indicator.

### TV Mode (`/tv`)
Fullscreen, auto-refresh, click to toggle fullscreen.

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

# Push schema
pnpm db:push

# Run
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

## Docker

```bash
# Start with docker-compose
docker-compose up -d

# The app will be available at http://localhost:3000
# Sync runs automatically every 15 minutes
```

## Pages

| Route | Description |
|-------|-------------|
| `/` | Main dashboard |
| `/tv` | TV/Projector mode (fullscreen, auto-refresh) |
| `/setup` | Create new goal |
| `/settings` | Manage accounts and goals |
| `/transactions` | View and add transactions |

## API Routes

### Goals
- `GET /api/goals` — List all active goals
- `POST /api/goals` — Create new goal
- `GET /api/goals/[id]` — Get goal with progress
- `GET /api/goals/[id]/stats` — Today/yesterday stats
- `DELETE /api/goals/[id]` — Deactivate goal

### Transactions
- `GET /api/transactions` — List recent transactions
- `POST /api/transactions` — Add manual transaction

### Bank Accounts
- `GET /api/accounts` — List connected accounts
- `DELETE /api/accounts/[id]` — Disconnect account

### Auth
- `GET /api/auth/tochka` — Start Точка OAuth
- `GET /api/auth/tochka/callback` — OAuth callback
- `POST /api/auth/tbank` — Connect Т-Банк with token

### Sync
- `POST /api/sync` — Trigger transaction sync

## Database Commands

```bash
pnpm db:generate  # Generate migrations
pnpm db:migrate   # Run migrations
pnpm db:push      # Push schema directly (dev)
pnpm db:studio    # Open Drizzle Studio
```

## Environment Variables

```env
# Database (required)
DATABASE_URL=postgresql://user:pass@localhost:5432/goal_dashboard

# Sync protection (recommended)
CRON_SECRET=your-secret-here

# Точка Bank (OAuth 2.0)
TOCHKA_CLIENT_ID=
TOCHKA_CLIENT_SECRET=
TOCHKA_REDIRECT_URI=http://localhost:3000/api/auth/tochka/callback
```

## Bank Setup

### Точка Bank

1. Go to Internet Bank → Integrations & API → Connect
2. Click "Register OAuth 2.0 application"
3. Select permissions:
   - `ReadAccountsBasic`
   - `ReadAccountsDetail`
   - `ReadBalances`
   - `ReadStatements`
4. Copy `client_id` and `client_secret` to `.env.local`
5. In the app, go to Settings → Connect Точка

[Documentation](https://developers.tochka.com/docs/tochka-api)

### Т-Банк (T-Business)

1. Go to Services → Integrations → API Integration → Connect
2. Issue token with bank statement permissions
3. In the app, go to Settings → Connect Т-Банк
4. Paste your token

[Documentation](https://developer.tbank.ru/docs/api/)

## Cron Setup

For automatic sync, set up a cron job:

```bash
# Every 15 minutes
*/15 * * * * curl -X POST https://your-domain/api/sync \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Or use the included docker-compose sync service.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** PostgreSQL + Drizzle ORM
- **Styling:** Tailwind CSS
- **Language:** TypeScript

## Project Structure

```
src/
├── app/
│   ├── api/          # API routes
│   ├── settings/     # Settings page
│   ├── setup/        # Goal creation
│   ├── transactions/ # Transaction history
│   ├── tv/           # TV mode
│   └── page.tsx      # Main dashboard
├── components/
│   ├── ui/           # Reusable components
│   └── *.tsx         # Dashboard components
├── db/
│   ├── schema.ts     # Drizzle schema
│   └── index.ts      # DB connection
├── hooks/            # React hooks
└── lib/              # Utilities
```

## Contributing

1. Fork the repo
2. Create a branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push (`git push origin feature/amazing`)
5. Open a Pull Request

## License

MIT © Croissan Studio
