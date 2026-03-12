/**
 * Точка Bank API Client (JWT authentication)
 *
 * Documentation: https://developers.tochka.com/
 */

import axios, { type AxiosInstance } from 'axios'
import type { BankAccount, BankClient, BankTransaction } from './types'

const API_URL = 'https://enter.tochka.com/uapi/open-banking/v1.0'

interface TochkaConfig {
  /** JWT token from Tochka dashboard */
  token: string
}

export class TochkaClient implements BankClient {
  private api: AxiosInstance

  constructor(config: TochkaConfig) {
    this.api = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.token}`,
      },
      timeout: 30_000,
    })
  }

  async getAccounts(): Promise<BankAccount[]> {
    const response = await this.api.get('/accounts')

    const accounts = response.data.Data?.Account || []

    return accounts.map((acc: any) => ({
      id: acc.accountId,
      name: acc.accountDetails?.[0]?.name || acc.accountId,
      currency: acc.currency || 'RUB',
      balance: acc.balance?.amount,
    }))
  }

  async getTransactions(
    accountId: string,
    fromDate: Date,
    toDate: Date,
  ): Promise<BankTransaction[]> {
    // Format dates as YYYY-MM-DD
    const formatDate = (d: Date) => d.toISOString().split('T')[0]

    // Step 1: Init statement (format: Data.Statement)
    const initResponse = await this.api.post('/statements', {
      Data: {
        Statement: {
          accountId,
          startDateTime: formatDate(fromDate),
          endDateTime: formatDate(toDate),
        },
      },
    })

    const statementId = initResponse.data.Data?.Statement?.statementId

    if (!statementId) {
      console.error('No statementId in response:', initResponse.data)
      return []
    }

    // Step 2: Poll until ready with exponential backoff
    let attempts = 0
    const maxAttempts = 10
    let delay = 1000

    while (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, delay))

      try {
        const response = await this.api.get(
          `/accounts/${accountId}/statements/${statementId}`,
        )

        // Statement is an array in the response
        const statements = response.data.Data?.Statement
        const statement = Array.isArray(statements) ? statements[0] : statements

        // Check if statement is ready
        if (statement?.status === 'Ready') {
          const txList = statement.Transaction || []

          return txList.map((tx: any) => ({
            id: tx.transactionId || tx.paymentId || String(Date.now()),
            amount: Math.abs(Number.parseFloat(tx.Amount?.amount || tx.amount || '0')),
            currency: tx.Amount?.currency || tx.currency || 'RUB',
            type:
              tx.creditDebitIndicator === 'Credit'
                ? ('income' as const)
                : ('expense' as const),
            counterparty:
              tx.creditDebitIndicator === 'Credit'
                ? tx.DebtorParty?.name
                : tx.CreditorParty?.name,
            description: tx.description,
            executedAt: new Date(tx.documentProcessDate || tx.bookingDateTime),
          }))
        }
      } catch (_error) {
        // Statement not ready yet, continue polling
      }

      attempts++
      delay = Math.min(delay * 1.5, 5000) // Max 5 seconds
    }

    throw new Error('Statement generation timeout')
  }
}
