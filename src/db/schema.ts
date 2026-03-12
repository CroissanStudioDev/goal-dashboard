import { createId } from '@paralleldrive/cuid2'
import {
  boolean,
  decimal,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core'
import { user } from './auth-schema'

// Enums
export const bankEnum = pgEnum('bank', ['TOCHKA', 'TBANK'])
export const transactionTypeEnum = pgEnum('transaction_type', [
  'INCOME',
  'EXPENSE',
])
export const syncStatusEnum = pgEnum('sync_status', [
  'RUNNING',
  'SUCCESS',
  'FAILED',
])

// Bank accounts
export const bankAccounts = pgTable(
  'bank_accounts',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),

    bank: bankEnum('bank').notNull(),
    accountId: text('account_id').notNull(),
    accountName: text('account_name').notNull(),
    currency: text('currency').default('RUB').notNull(),

    // Auth tokens (encrypted)
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    tokenExpiry: timestamp('token_expiry'),

    isActive: boolean('is_active').default(true).notNull(),
    lastSyncAt: timestamp('last_sync_at'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    bankAccountUnique: unique().on(table.userId, table.bank, table.accountId),
    userIdIdx: index('bank_accounts_user_id_idx').on(table.userId),
  }),
)

// Transactions
export const transactions = pgTable(
  'transactions',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    bankAccountId: text('bank_account_id')
      .notNull()
      .references(() => bankAccounts.id, { onDelete: 'cascade' }),

    externalId: text('external_id').notNull(),
    amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
    currency: text('currency').default('RUB').notNull(),

    type: transactionTypeEnum('type').notNull(),
    counterparty: text('counterparty'),
    description: text('description'),

    executedAt: timestamp('executed_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    bankAccountExternalUnique: unique().on(
      table.bankAccountId,
      table.externalId,
    ),
    userIdIdx: index('transactions_user_id_idx').on(table.userId),
    executedAtIdx: index('transactions_executed_at_idx').on(table.executedAt),
    userTypeExecutedAtIdx: index('transactions_user_type_executed_at_idx').on(
      table.userId,
      table.type,
      table.executedAt,
    ),
  }),
)

// Goals
export const goals = pgTable(
  'goals',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),

    name: text('name').notNull(),

    targetAmount: decimal('target_amount', {
      precision: 15,
      scale: 2,
    }).notNull(),
    currency: text('currency').default('RUB').notNull(),

    startDate: timestamp('start_date').notNull(),
    endDate: timestamp('end_date').notNull(),

    // JSON array of account IDs to track (empty = all user's accounts)
    accountIds: text('account_ids').array().default([]).notNull(),

    trackIncome: boolean('track_income').default(true).notNull(),
    trackExpense: boolean('track_expense').default(false).notNull(),

    isActive: boolean('is_active').default(true).notNull(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('goals_user_id_idx').on(table.userId),
    userActiveIdx: index('goals_user_active_idx').on(
      table.userId,
      table.isActive,
    ),
  }),
)

// Sync logs
export const syncLogs = pgTable(
  'sync_logs',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    bankAccountId: text('bank_account_id').notNull(),

    status: syncStatusEnum('status').notNull(),
    message: text('message'),

    transactionsAdded: decimal('transactions_added', {
      precision: 10,
      scale: 0,
    })
      .default('0')
      .notNull(),

    startedAt: timestamp('started_at').notNull(),
    completedAt: timestamp('completed_at'),
  },
  (table) => ({
    userIdIdx: index('sync_logs_user_id_idx').on(table.userId),
  }),
)

// Types
export type BankAccount = typeof bankAccounts.$inferSelect
export type NewBankAccount = typeof bankAccounts.$inferInsert
export type Transaction = typeof transactions.$inferSelect
export type NewTransaction = typeof transactions.$inferInsert
export type Goal = typeof goals.$inferSelect
export type NewGoal = typeof goals.$inferInsert
export type SyncLog = typeof syncLogs.$inferSelect
