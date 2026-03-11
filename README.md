# 🎯 Goal Dashboard

Real-time revenue tracking dashboard for teams. Set a goal, watch your progress on a big screen.

![Dashboard](https://img.shields.io/badge/Next.js-14-black)
![Database](https://img.shields.io/badge/Drizzle-ORM-green)
![License](https://img.shields.io/badge/License-MIT-blue)

## Features

- **Goal-driven** — Set monthly/quarterly revenue targets
- **Multi-bank** — Aggregate data from Russian banks (Точка, Т-Банк)
- **Real-time** — Auto-sync every 10 minutes while page is open
- **TV Mode** — Fullscreen mode optimized for office projectors
- **Secure** — Encrypted token storage, Basic Auth, rate limiting
- **Progress tracking** — Visual progress bar with pace indicator
- **Forecasting** — Predict goal completion date based on current pace

## Security

- ✅ **Token encryption** — Bank tokens encrypted with AES-256-GCM
- ✅ **Basic Auth** — Optional password protection
- ✅ **CSRF protection** — OAuth state validation
- ✅ **Rate limiting** — 10 req/min on sync endpoint
- ✅ **mTLS support** — For T-Bank production API

## Quick Start

```bash
# Clone
git clone https://github.com/CroissanStudioDev/goal-dashboard.git
cd goal-dashboard

# Install
pnpm install

# Configure
cp .env.example .env.local
# Edit .env.local - set DATABASE_URL and ENCRYPTION_SECRET (required)

# Push schema
pnpm db:push

# Run
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

```env
# Required
DATABASE_URL=postgresql://user:pass@localhost:5432/goal_dashboard
ENCRYPTION_SECRET=your-32-char-secret-key  # openssl rand -hex 32

# Optional - Basic Auth
AUTH_USERNAME=admin
AUTH_PASSWORD=secret

# Optional - Точка Bank
TOCHKA_CLIENT_ID=
TOCHKA_CLIENT_SECRET=
TOCHKA_REDIRECT_URI=http://localhost:3000/api/auth/tochka/callback

# Optional - T-Bank mTLS
TBANK_CERT_PATH=/path/to/cert.pem
TBANK_KEY_PATH=/path/to/key.pem
TBANK_CERT_PASSWORD=
```

## Pages

| Route | Description |
|-------|-------------|
| `/` | Main dashboard |
| `/tv` | TV/Projector mode (fullscreen, 30s refresh) |
| `/setup` | Create new goal |
| `/settings` | Manage banks and goals |
| `/transactions` | View and add transactions |

## API Routes

### Goals
- `GET /api/goals` — List active goals
- `POST /api/goals` — Create goal
- `GET /api/goals/[id]` — Get goal with progress
- `DELETE /api/goals/[id]` — Deactivate goal

### Sync
- `POST /api/sync` — Sync bank transactions (rate limited)
- `GET /api/sync` — Get sync status

### Auth
- `GET /api/auth/tochka` — Start Точка OAuth
- `POST /api/auth/tbank` — Connect T-Bank with token

## Bank Setup

### Точка Bank

1. Internet Bank → Integrations & API → Connect
2. Register OAuth 2.0 application
3. Select permissions: `ReadAccountsBasic`, `ReadAccountsDetail`, `ReadBalances`, `ReadStatements`
4. Copy credentials to `.env.local`

### T-Bank

1. T-Business → Services → API Integration
2. Issue token + download certificate
3. In app: Settings → Connect T-Bank
4. For production: set `TBANK_CERT_PATH` and `TBANK_KEY_PATH`

## Architecture

```
src/
├── app/
│   ├── api/          # API routes
│   ├── (pages)/      # UI pages
│   ├── error.tsx     # Error boundary
│   └── middleware.ts # Auth middleware
├── components/       # React components
├── db/              # Drizzle schema
├── hooks/           # React hooks (sync, fullscreen)
└── lib/
    ├── banks/       # Bank API clients
    ├── auth.ts      # Auth helpers
    ├── crypto.ts    # Token encryption
    ├── env.ts       # Env validation
    ├── goals.ts     # Goal calculations
    └── rate-limit.ts
```

## Docker

```bash
docker-compose up -d
```

## License

MIT © Croissan Studio
