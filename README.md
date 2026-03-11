# 🎯 Goal Dashboard

Real-time revenue tracking dashboard for teams. Set a goal, watch your progress on a big screen.

![Dashboard Preview](docs/preview.png)

## Features

- **Goal-driven** — Set monthly/quarterly revenue targets
- **Multi-bank** — Aggregate data from multiple Russian banks (Точка, Т-Банк)
- **Real-time** — Auto-refresh every 5-15 minutes
- **TV-optimized** — Large, readable numbers for office projectors
- **Progress tracking** — Visual progress bar with pace indicator
- **Forecasting** — Predict goal completion date based on current pace

## Tech Stack

- **Frontend:** Next.js 14, React, Tailwind CSS
- **Backend:** Node.js, Express
- **Database:** PostgreSQL
- **Bank APIs:** Точка Open API, Т-Банк T-API

## Quick Start

```bash
# Clone
git clone https://github.com/CroissanStudioDev/goal-dashboard.git
cd goal-dashboard

# Install
pnpm install

# Configure
cp .env.example .env.local
# Edit .env.local with your bank credentials

# Run
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

## Configuration

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/goal_dashboard

# Точка Bank
TOCHKA_CLIENT_ID=your_client_id
TOCHKA_CLIENT_SECRET=your_client_secret
TOCHKA_REDIRECT_URI=http://localhost:3000/api/auth/tochka/callback

# Т-Банк
TBANK_TOKEN=your_token
TBANK_CERTIFICATE_PATH=/path/to/cert.pem
```

### Bank Setup

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
3. Generate certificate
4. Copy credentials to `.env.local`

[Full documentation](https://developer.tbank.ru/docs/api/)
</details>

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Точка API  │────▶│             │     │             │
└─────────────┘     │   Sync      │────▶│  PostgreSQL │
┌─────────────┐     │   Worker    │     │             │
│ Т-Банк API  │────▶│             │     └──────┬──────┘
└─────────────┘     └─────────────┘            │
                                               ▼
                                     ┌─────────────────┐
                                     │   Next.js App   │
                                     │  (Dashboard UI) │
                                     └─────────────────┘
```

## Roadmap

- [x] Project setup
- [ ] Bank OAuth integration (Точка)
- [ ] Bank token integration (Т-Банк)
- [ ] Transaction sync worker
- [ ] Goal management UI
- [ ] Progress dashboard
- [ ] Forecasting algorithm
- [ ] TV/Kiosk mode
- [ ] Telegram alerts

## License

MIT © Croissan Studio
