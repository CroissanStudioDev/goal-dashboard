/**
 * Т-Банк (T-Bank) API Client
 * 
 * Documentation: https://developer.tbank.ru/docs/api/
 */

import axios, { AxiosInstance } from 'axios'
import { BankClient, BankAccount, BankTransaction } from './types'

const API_URL = 'https://api.tbank.ru/v1'

interface TBankConfig {
  token: string
  // Certificate path for mTLS (required for production)
  certificatePath?: string
  certificatePassword?: string
}

export class TBankClient implements BankClient {
  private config: TBankConfig
  private api: AxiosInstance
  
  constructor(config: TBankConfig) {
    this.config = config
    
    // TODO: Add mTLS certificate support for production
    this.api = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.token}`,
      },
    })
  }
  
  async getAccounts(): Promise<BankAccount[]> {
    const response = await this.api.get('/bank-accounts')
    
    return response.data.map((acc: any) => ({
      id: acc.accountNumber,
      name: acc.name || acc.accountNumber,
      currency: acc.currency?.name || 'RUB',
      balance: acc.balance?.otb,
    }))
  }
  
  async getTransactions(
    accountId: string,
    fromDate: Date,
    toDate: Date
  ): Promise<BankTransaction[]> {
    const response = await this.api.get('/bank-statement', {
      params: {
        accountNumber: accountId,
        from: formatDate(fromDate),
        to: formatDate(toDate),
      },
    })
    
    const operations = response.data.operation || []
    
    return operations.map((op: any) => ({
      id: op.id || op.operationId,
      amount: Math.abs(op.amount),
      currency: op.currency?.name || 'RUB',
      type: op.amount > 0 ? 'income' : 'expense',
      counterparty: op.counterparty?.name,
      description: op.description,
      executedAt: new Date(op.date),
    }))
  }
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}
