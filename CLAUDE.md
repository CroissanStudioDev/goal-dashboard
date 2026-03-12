# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
pnpm dev          # Start development server (localhost:3000)
pnpm build        # Production build
pnpm lint         # ESLint

# Database (Drizzle)
pnpm db:push      # Push schema to database (dev)
pnpm db:generate  # Generate migrations
pnpm db:migrate   # Run migrations
pnpm db:studio    # Open Drizzle Studio UI
```

## Architecture Overview

Goal Dashboard is a Next.js 14 App Router application for tracking revenue goals with Russian bank integrations.

### Core Data Flow

```
Banks (Tochka/T-Bank) --> /api/sync --> transactions table
                                              |
                                              v
goals table <-- calculateGoalProgress() <-- src/lib/goals.ts
     |
     v
Dashboard UI (SSR) / TV Mode (Client)
```

### Key Modules

| Path | Purpose |
|------|---------|
| `src/lib/auth.ts` | Better Auth server config |
| `src/lib/auth-client.ts` | Better Auth client hooks |
| `src/lib/goals.ts` | Goal progress/pace calculations (single source of truth) |
| `src/lib/crypto.ts` | AES-256-GCM encryption for bank tokens |
| `src/lib/banks/` | Bank API clients (Tochka OAuth, T-Bank mTLS) |
| `src/db/schema.ts` | App tables (bank_accounts, transactions, goals, sync_logs) |
| `src/db/auth-schema.ts` | Better Auth tables (user, session, account, verification) |

### Authentication Pattern

All API routes requiring auth use:
```typescript
import { getAuthSession } from '@/lib/session'

const session = await getAuthSession()
if (!session) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
const userId = session.user.id
```

### Database Relationships

- `user` 1:N `bank_accounts` (userId FK, cascade delete)
- `bank_accounts` 1:N `transactions` (bankAccountId FK, cascade delete)
- `user` 1:N `goals` (userId FK, cascade delete)
- Transactions deduplicated by `(bankAccountId, externalId)` unique constraint

### Client-Side Sync Pattern

TV mode and dashboard use hooks for background sync:
- `useAutoRefresh(ms)` - Page refresh interval
- `useBankSync({ intervalMs, syncOnMount })` - Calls POST /api/sync periodically

### UI Language

All user-facing text is in **Russian**. Keep this consistent.

## Environment Variables

Required:
- `DATABASE_URL` - PostgreSQL connection string
- `BETTER_AUTH_SECRET` - Session signing key
- `ENCRYPTION_SECRET` - AES key for bank tokens (min 32 chars)
- `NEXT_PUBLIC_APP_URL` / `BETTER_AUTH_URL` - App base URL

Bank integrations (optional):
- `TOCHKA_CLIENT_ID`, `TOCHKA_CLIENT_SECRET`, `TOCHKA_REDIRECT_URI`
- `TBANK_CERT_PATH`, `TBANK_KEY_PATH`, `TBANK_CERT_PASSWORD`
