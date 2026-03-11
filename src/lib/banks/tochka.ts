/**
 * Точка Bank API Client
 * 
 * Documentation: https://developers.tochka.com/docs/tochka-api
 */

import axios, { AxiosInstance } from 'axios'
import { BankClient, BankAccount, BankTransaction } from './types'

const BASE_URL = 'https://enter.tochka.com'
const API_URL = 'https://enter.tochka.com/uapi/v1.0'

interface TochkaConfig {
  clientId: string
  clientSecret: string
  accessToken?: string
  refreshToken?: string
}

export class TochkaClient implements BankClient {
  private config: TochkaConfig
  private api: AxiosInstance
  
  constructor(config: TochkaConfig) {
    this.config = config
    this.api = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    // Add auth header to all requests
    this.api.interceptors.request.use((req) => {
      if (this.config.accessToken) {
        req.headers.Authorization = `Bearer ${this.config.accessToken}`
      }
      return req
    })
  }
  
  /**
   * Get OAuth authorization URL
   */
  getAuthUrl(redirectUri: string, consentId: string, state: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      response_type: 'code',
      redirect_uri: redirectUri,
      scope: 'accounts balances customers statements',
      consent_id: consentId,
      state,
    })
    
    return `${BASE_URL}/connect/authorize?${params}`
  }
  
  /**
   * Exchange authorization code for tokens
   */
  async exchangeCode(code: string, redirectUri: string): Promise<{
    accessToken: string
    refreshToken: string
    expiresIn: number
  }> {
    const response = await axios.post(
      `${BASE_URL}/connect/token`,
      new URLSearchParams({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        scope: 'accounts balances customers statements',
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    )
    
    this.config.accessToken = response.data.access_token
    this.config.refreshToken = response.data.refresh_token
    
    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expiresIn: response.data.expires_in,
    }
  }
  
  async refreshTokenIfNeeded(): Promise<void> {
    if (!this.config.refreshToken) return
    
    const response = await axios.post(
      `${BASE_URL}/connect/token`,
      new URLSearchParams({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        grant_type: 'refresh_token',
        refresh_token: this.config.refreshToken,
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    )
    
    this.config.accessToken = response.data.access_token
    this.config.refreshToken = response.data.refresh_token
  }
  
  async getAccounts(): Promise<BankAccount[]> {
    const response = await this.api.get('/accounts')
    
    return response.data.Data.Account.map((acc: any) => ({
      id: acc.accountId,
      name: acc.description || acc.accountId,
      currency: acc.currency,
    }))
  }
  
  async getTransactions(
    accountId: string,
    fromDate: Date,
    toDate: Date
  ): Promise<BankTransaction[]> {
    // Step 1: Init statement
    const initResponse = await this.api.post('/statements', {
      Data: {
        accountId,
        startDateTime: fromDate.toISOString(),
        endDateTime: toDate.toISOString(),
      },
    })
    
    const statementId = initResponse.data.Data.statementId
    
    // Step 2: Poll until ready (simplified - in production use proper polling)
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Step 3: Get statement
    const response = await this.api.get(
      `/accounts/${accountId}/statements/${statementId}`
    )
    
    const transactions = response.data.Data.Transaction || []
    
    return transactions.map((tx: any) => ({
      id: tx.transactionId,
      amount: Math.abs(parseFloat(tx.amount)),
      currency: tx.currency,
      type: tx.creditDebitIndicator === 'Credit' ? 'income' : 'expense',
      counterparty: tx.counterpartyName,
      description: tx.description,
      executedAt: new Date(tx.bookingDateTime),
    }))
  }
}
