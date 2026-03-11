/**
 * Common types for bank integrations
 */

export interface BankTransaction {
  id: string
  amount: number
  currency: string
  type: 'income' | 'expense'
  counterparty?: string
  description?: string
  executedAt: Date
}

export interface BankAccount {
  id: string
  name: string
  currency: string
  balance?: number
}

export interface BankClient {
  /**
   * Get list of accounts
   */
  getAccounts(): Promise<BankAccount[]>
  
  /**
   * Get transactions for date range
   */
  getTransactions(
    accountId: string,
    fromDate: Date,
    toDate: Date
  ): Promise<BankTransaction[]>
  
  /**
   * Refresh access token if needed
   */
  refreshTokenIfNeeded?(): Promise<void>
}
