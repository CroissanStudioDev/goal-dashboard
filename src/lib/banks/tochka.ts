/**
 * Точка Bank API Client
 * 
 * Documentation: https://developers.tochka.com/docs/tochka-api
 */

import axios, { AxiosInstance, AxiosError } from 'axios'
import { BankClient, BankAccount, BankTransaction } from './types'

const BASE_URL = 'https://enter.tochka.com'
const API_URL = 'https://enter.tochka.com/uapi/v1.0'

const PERMISSIONS = [
  'ReadAccountsBasic',
  'ReadAccountsDetail',
  'ReadBalances',
  'ReadStatements',
  'ReadCustomerData',
]

interface TochkaConfig {
  clientId: string
  clientSecret: string
  accessToken?: string
  refreshToken?: string
  onTokenRefresh?: (accessToken: string, refreshToken: string) => Promise<void>
}

interface TokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
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
      timeout: 30_000,
    })
    
    // Add auth header to all requests
    this.api.interceptors.request.use((req) => {
      if (this.config.accessToken) {
        req.headers.Authorization = `Bearer ${this.config.accessToken}`
      }
      return req
    })
    
    // Auto-retry on 401 with token refresh
    this.api.interceptors.response.use(
      (res) => res,
      async (error: AxiosError) => {
        if (error.response?.status === 401 && this.config.refreshToken) {
          await this.refreshTokenIfNeeded()
          // Retry original request
          const config = error.config!
          config.headers.Authorization = `Bearer ${this.config.accessToken}`
          return this.api.request(config)
        }
        throw error
      }
    )
  }
  
  /**
   * Step 1: Get client credentials token for consent creation
   */
  async getClientCredentialsToken(): Promise<string> {
    const response = await axios.post<TokenResponse>(
      `${BASE_URL}/connect/token`,
      new URLSearchParams({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        grant_type: 'client_credentials',
        scope: 'accounts balances customers statements',
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    )
    
    return response.data.access_token
  }
  
  /**
   * Step 2: Create consent request
   */
  async createConsent(expirationDate?: Date): Promise<string> {
    const token = await this.getClientCredentialsToken()
    
    const response = await axios.post(
      `${API_URL}/consents`,
      {
        Data: {
          permissions: PERMISSIONS,
          ...(expirationDate && {
            expirationDateTime: expirationDate.toISOString(),
          }),
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      }
    )
    
    return response.data.Data.consentId
  }
  
  /**
   * Step 3: Get OAuth authorization URL
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
   * Step 4: Exchange authorization code for tokens
   */
  async exchangeCode(code: string, redirectUri: string): Promise<{
    accessToken: string
    refreshToken: string
    expiresIn: number
  }> {
    const response = await axios.post<TokenResponse>(
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
  
  /**
   * Refresh access token
   */
  async refreshTokenIfNeeded(): Promise<{ accessToken: string; refreshToken: string } | null> {
    if (!this.config.refreshToken) return null
    
    try {
      const response = await axios.post<TokenResponse>(
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
      
      // Callback to save new tokens
      if (this.config.onTokenRefresh) {
        await this.config.onTokenRefresh(
          response.data.access_token,
          response.data.refresh_token
        )
      }
      
      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
      }
    } catch (error) {
      console.error('Failed to refresh Tochka token:', error)
      return null
    }
  }
  
  async getAccounts(): Promise<BankAccount[]> {
    const response = await this.api.get('/accounts')
    
    const accounts = response.data.Data?.Account || []
    
    return accounts.map((acc: any) => ({
      id: acc.accountId,
      name: acc.description || acc.accountId,
      currency: acc.currency || 'RUB',
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
    
    // Step 2: Poll until ready with exponential backoff
    let attempts = 0
    const maxAttempts = 10
    let delay = 1000
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, delay))
      
      try {
        const response = await this.api.get(
          `/accounts/${accountId}/statements/${statementId}`
        )
        
        const status = response.data.Data?.Statement?.status
        
        if (status === 'Ready' || response.data.Data?.Transaction) {
          const txList = response.data.Data.Transaction || []
          
          return txList.map((tx: any) => ({
            id: tx.transactionId,
            amount: Math.abs(parseFloat(tx.amount || '0')),
            currency: tx.currency || 'RUB',
            type: tx.creditDebitIndicator === 'Credit' ? 'income' as const : 'expense' as const,
            counterparty: tx.counterpartyName,
            description: tx.description,
            executedAt: new Date(tx.bookingDateTime),
          }))
        }
      } catch (error) {
        // Statement not ready yet, continue polling
      }
      
      attempts++
      delay = Math.min(delay * 1.5, 5000) // Max 5 seconds
    }
    
    throw new Error('Statement generation timeout')
  }
}
