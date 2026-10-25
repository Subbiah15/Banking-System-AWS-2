import { api } from './api'

export type AccountType = 'CHECKING' | 'SAVINGS'
export type AccountStatus = 'ACTIVE' | 'FROZEN' | 'CLOSED'
export type DemoBank = 'SBI' | 'IOB' | 'HDFC' | 'ICICI' | 'AXIS'

export interface Account {
  id: string
  accountNumber: string
  type: AccountType | 'SYSTEM'
  bankName: string
  currency: string
  balance: string
  status: AccountStatus
  createdAt: string
}

export interface LedgerEntry {
  id: string
  transactionId: string
  reference: string
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER'
  description: string | null
  direction: 'DEBIT' | 'CREDIT'
  amount: string
  balanceAfter: string | null
  createdAt: string
}

export async function listAccounts(): Promise<Account[]> {
  const { data } = await api.get<Account[]>('/api/v1/accounts')
  return data
}

export async function getAccount(id: string): Promise<Account> {
  const { data } = await api.get<Account>(`/api/v1/accounts/${id}`)
  return data
}

export async function createAccount(type: AccountType, bankName: DemoBank): Promise<Account> {
  const { data } = await api.post<Account>('/api/v1/accounts', { type, bankName, currency: 'INR' })
  return data
}

export async function deposit(id: string, amount: number): Promise<Account> {
  const { data } = await api.post<Account>(`/api/v1/accounts/${id}/deposit`, { amount }, {
    headers: { 'Idempotency-Key': crypto.randomUUID() },
  })
  return data
}

export async function withdraw(id: string, amount: number): Promise<Account> {
  const { data } = await api.post<Account>(`/api/v1/accounts/${id}/withdraw`, { amount })
  return data
}

export async function listTransactions(id: string): Promise<LedgerEntry[]> {
  const { data } = await api.get<LedgerEntry[]>(`/api/v1/accounts/${id}/transactions`)
  return data
}
