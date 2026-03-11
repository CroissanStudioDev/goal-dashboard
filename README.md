# 🎯 Goal Dashboard

Real-time revenue tracking dashboard for teams. Set a goal, watch your progress on a big screen.

![Dashboard](https://img.shields.io/badge/Next.js-14-black)
![Auth](https://img.shields.io/badge/Better_Auth-1.2-blue)
![Database](https://img.shields.io/badge/Drizzle-ORM-green)
![License](https://img.shields.io/badge/License-MIT-blue)

## Features

- **Goal-driven** — Set monthly/quarterly revenue targets
- **Multi-bank** — Aggregate data from Russian banks (Точка, Т-Банк)
- **Real-time** — Auto-sync every 10 minutes while page is open
- **TV Mode** — Fullscreen mode optimized for office projectors
- **Secure** — Better Auth, encrypted token storage, rate limiting
- **Progress tracking** — Visual progress bar with pace indicator
- **Forecasting** — Predict goal completion date based on current pace

## Security

- ✅ **Better Auth** — Full authentication with email/password
- ✅ **Token encryption** — Bank tokens encrypted with AES-256-GCM
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
# Edit .env.local - set required variables

# Push schema (creates auth + app tables)
pnpm db:push

# Run
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

First user to sign up becomes the admin.

## Environment Variables

```env
# Required
DATABASE_URL=postgresql://user:pass@localhost:5432/goal_dashboard
BETTER_AUTH_SECRET=openssl-rand-base64-32
ENCRYPTION_SECRET=openssl-rand-hex-32

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
BETTER_AUTH_URL=http://localhost:3000

# Optional - Точка Bank
TOCHKA_CLIENT_ID=
TOCHKA_CLIENT_SECRET=
TOCHKA_REDIRECT_URI=http://localhost:3000/api/banks/tochka/callback

# Optional - T-Bank mTLS
TBANK_CERT_PATH=/path/to/cert.pem
TBANK_KEY_PATH=/path/to/key.pem
TBANK_CERT_PASSWORD=
```

## Pages

| Route | Description |
|-------|-------------|
| `/sign-in` | Login page |
| `/sign-up` | Registration page |
| `/` | Main dashboard |
| `/tv` | TV/Projector mode |
| `/setup` | Create new goal |
| `/settings` | Manage banks and goals |
| `/transactions` | View and add transactions |

## API Routes

### Auth (Better Auth)
- `POST /api/auth/sign-up` — Register
- `POST /api/auth/sign-in/email` — Login
- `POST /api/auth/sign-out` — Logout
- `GET /api/auth/get-session` — Get session

### Goals
- `GET /api/goals` — List active goals
- `POST /api/goals` — Create goal
- `GET /api/goals/[id]` — Get goal with progress
- `DELETE /api/goals/[id]` — Deactivate goal

### Banks
- `GET /api/banks/tochka` — Start Точка OAuth
- `GET /api/banks/tochka/callback` — OAuth callback
- `POST /api/banks/tbank` — Connect T-Bank with token

### Sync
- `POST /api/sync` — Sync bank transactions

## Database Schema

Better Auth tables:
- `user` — Users
- `session` — Sessions
- `account` — OAuth accounts
- `verification` — Email verification

App tables:
- `bank_accounts` — Connected bank accounts
- `transactions` — Synced transactions
- `goals` — Revenue goals
- `sync_logs` — Sync history

## Architecture

```
src/
├── app/
│   ├── (auth)/       # Sign in/up pages
│   ├── api/
│   │   ├── auth/     # Better Auth handler
│   │   ├── banks/    # Bank OAuth
│   │   └── ...       # Other API routes
│   └── ...           # App pages
├── components/       # React components
├── db/
│   ├── schema.ts     # App schema
│   └── auth-schema.ts # Better Auth schema
├── hooks/            # React hooks
└── lib/
    ├── auth.ts       # Better Auth config
    ├── auth-client.ts # Client-side auth
    ├── crypto.ts     # Token encryption
    └── goals.ts      # Goal calculations
```

## License

MIT © Croissan Studio
