import { api, type Profile } from './api'
import type { AccountType, DemoBank } from './accounts'

export async function listAllUsers(): Promise<Profile[]> {
  const { data } = await api.get<Profile[]>('/api/v1/admin/users')
  return data
}

export interface CreateCustomerPayload {
  email: string
  password: string
  firstName: string
  lastName: string
  dateOfBirth?: string
  phone?: string
  addressLine1?: string
  city?: string
  country?: string
  bankName: DemoBank
  accountType: AccountType
  openingDeposit: number
}

export async function createCustomer(payload: CreateCustomerPayload): Promise<Profile> {
  const { data } = await api.post<Profile>('/api/v1/admin/users', payload)
  return data
}

export interface AuditEntry {
  id: string
  actorUserId: string | null
  action: string
  entityType: string
  entityId: string | null
  message: string
  createdAt: string
}

export async function listAudit(size = 50): Promise<AuditEntry[]> {
  const { data } = await api.get<AuditEntry[]>('/api/v1/admin/audit', { params: { size } })
  return data
}

export interface AdminAccount {
  accountNumber: string
  type: string
  bankName: string
  balance: string
  currency: string
  status: string
  ownerEmail: string
}

export async function listAdminAccounts(): Promise<AdminAccount[]> {
  const { data } = await api.get<AdminAccount[]>('/api/v1/admin/accounts')
  return data
}

export async function tellerDeposit(accountNumber: string, amount: number): Promise<void> {
  await api.post('/api/v1/admin/accounts/deposit', { accountNumber, amount })
}
