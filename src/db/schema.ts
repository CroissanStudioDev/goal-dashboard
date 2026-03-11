import { pgTable, text, timestamp, boolean, decimal, pgEnum, index, unique } from 'drizzle-orm/pg-core'
import { createId } from '@paralleldrive/cuid2'

// Enums
export const bankEnum = pgEnum('bank', ['TOCHKA', 'TBANK'])
export const transactionTypeEnum = pgEnum('transaction_type', ['INCOME', 'EXPENSE'])
export const syncStatusEnum = pgEnum('sync_status', ['RUNNING', 'SUCCESS', 'FAILED'])

// Bank accounts
export const bankAccounts = pgTable('bank_accounts', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  bank: bankEnum('bank').notNull(),
  accountId: text('account_id').notNull(),
  accountName: text('account_name').notNull(),
  currency: text('currency').default('RUB').notNull(),
  
  // Auth tokens
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  tokenExpiry: timestamp('token_expiry'),
  
  isActive: boolean('is_active').default(true).notNull(),
  lastSyncAt: timestamp('last_sync_at'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  bankAccountUnique: unique().on(table.bank, table.accountId),
}))

// Transactions
export const transactions = pgTable('transactions', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  bankAccountId: text('bank_account_id').notNull().references(() => bankAccounts.id),
  
  externalId: text('external_id').notNull(),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  currency: text('currency').default('RUB').notNull(),
  
  type: transactionTypeEnum('type').notNull(),
  counterparty: text('counterparty'),
  description: text('description'),
  
  executedAt: timestamp('executed_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  bankAccountExternalUnique: unique().on(table.bankAccountId, table.externalId),
  executedAtIdx: index('transactions_executed_at_idx').on(table.executedAt),
  typeExecutedAtIdx: index('transactions_type_executed_at_idx').on(table.type, table.executedAt),
}))

// Goals
export const goals = pgTable('goals', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull(),
  
  targetAmount: decimal('target_amount', { precision: 15, scale: 2 }).notNull(),
  currency: text('currency').default('RUB').notNull(),
  
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  
  // JSON array of account IDs to track (empty = all)
  accountIds: text('account_ids').array().default([]).notNull(),
  
  trackIncome: boolean('track_income').default(true).notNull(),
  trackExpense: boolean('track_expense').default(false).notNull(),
  
  isActive: boolean('is_active').default(true).notNull(),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Sync logs
export const syncLogs = pgTable('sync_logs', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  bankAccountId: text('bank_account_id').notNull(),
  
  status: syncStatusEnum('status').notNull(),
  message: text('message'),
  
  transactionsAdded: decimal('transactions_added', { precision: 10, scale: 0 }).default('0').notNull(),
  
  startedAt: timestamp('started_at').notNull(),
  completedAt: timestamp('completed_at'),
})

// Types
export type BankAccount = typeof bankAccounts.$inferSelect
export type NewBankAccount = typeof bankAccounts.$inferInsert
export type Transaction = typeof transactions.$inferSelect
export type NewTransaction = typeof transactions.$inferInsert
export type Goal = typeof goals.$inferSelect
export type NewGoal = typeof goals.$inferInsert
export type SyncLog = typeof syncLogs.$inferSelect
