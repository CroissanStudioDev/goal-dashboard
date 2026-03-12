/**
 * Т-Банк (T-Bank) API Client
 *
 * Documentation: https://developer.tbank.ru/docs/api/
 */

import fs from 'node:fs'
import https from 'node:https'
import axios, { type AxiosInstance } from 'axios'
import type { BankAccount, BankClient, BankTransaction } from './types'

const API_URL = 'https://api.tbank.ru/v1'

interface TBankConfig {
  token: string
  // mTLS certificate (required for production)
  certificatePath?: string
  certificateKeyPath?: string
  certificatePassword?: string
}

export class TBankClient implements BankClient {
  private api: AxiosInstance

  constructor(config: TBankConfig) {
    // Create HTTPS agent with mTLS if certificate provided
    let httpsAgent: https.Agent | undefined

    if (config.certificatePath && config.certificateKeyPath) {
      try {
        httpsAgent = new https.Agent({
          cert: fs.readFileSync(config.certificatePath),
          key: fs.readFileSync(config.certificateKeyPath),
          passphrase: config.certificatePassword,
          rejectUnauthorized: true,
        })
      } catch (error) {
        console.warn('Failed to load T-Bank certificate, mTLS disabled:', error)
      }
    }

    this.api = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.token}`,
      },
      timeout: 30_000,
      ...(httpsAgent && { httpsAgent }),
    })
  }

  async getAccounts(): Promise<BankAccount[]> {
    const response = await this.api.get('/bank-accounts')

    const accounts = Array.isArray(response.data)
      ? response.data
      : response.data.accounts || []

    return accounts.map((acc: any) => ({
      id: acc.accountNumber || acc.id,
      name: acc.name || acc.accountNumber || acc.id,
      currency: acc.currency?.name || acc.currency || 'RUB',
      balance: acc.balance?.otb ?? acc.balance,
    }))
  }

  async getTransactions(
    accountId: string,
    fromDate: Date,
    toDate: Date,
  ): Promise<BankTransaction[]> {
    const response = await this.api.get('/bank-statement', {
      params: {
        accountNumber: accountId,
        from: formatDate(fromDate),
        to: formatDate(toDate),
      },
    })

    const operations = response.data.operation || response.data.operations || []

    return operations.map((op: any) => ({
      id: op.id || op.operationId || `${op.date}-${op.amount}`,
      amount: Math.abs(Number(op.amount) || 0),
      currency: op.currency?.name || op.currency || 'RUB',
      type: Number(op.amount) > 0 ? ('income' as const) : ('expense' as const),
      counterparty: op.counterparty?.name || op.counterpartyName,
      description: op.description || op.purpose,
      executedAt: new Date(op.date || op.operationDate),
    }))
  }
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}
