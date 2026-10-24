import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import AppLayout from '../components/AppLayout'
import { useAuth } from '../context/AuthContext'
import { useState, type FormEvent } from 'react'
import {
  createCustomer,
  listAdminAccounts,
  listAllUsers,
  listAudit,
  tellerDeposit,
  type CreateCustomerPayload,
} from '../lib/admin'
import type { AccountType, DemoBank } from '../lib/accounts'
import { formatDateTime, formatMoney } from '../lib/format'
import { apiErrorMessage } from '../lib/errors'

const BANK_LABELS: Record<DemoBank, string> = {
  SBI: 'SBI',
  IOB: 'Indian Overseas Bank',
  HDFC: 'HDFC Bank',
  ICICI: 'ICICI Bank',
  AXIS: 'Axis Bank',
}

export default function AdminPage() {
  const { user } = useAuth()
  const usersQ = useQuery({ queryKey: ['admin-users'], queryFn: listAllUsers, enabled: user?.role === 'ADMIN' })

  if (user?.role !== 'ADMIN') {
    return (
      <AppLayout>
        <p className="text-slate-500">Admins only.</p>
      </AppLayout>
    )
  }

  const users = usersQ.data ?? []

  return (
    <AppLayout>
      <h1 className="text-2xl font-bold tracking-tight">Bank administration</h1>
      <p className="mt-1 text-sm text-slate-500">Add demo customers, record fictional profile details, open INR bank accounts, and manage teller deposits. Do not enter real identity documents.</p>

      <CreateCustomerForm />

      <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold">Customers</h2>
        <p className="mt-1 text-sm text-slate-500">Demo profile information only; identity verification is not enforced.</p>
        {usersQ.isLoading && <p className="text-slate-500">Loading…</p>}
        {!usersQ.isLoading && users.length === 0 && (
          <p className="text-slate-500">No customers yet.</p>
        )}
        {users.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400">
                <th className="pb-2">Customer</th>
                <th className="pb-2">Email</th>
                <th className="pb-2">Phone</th>
                <th className="pb-2">City</th>
                <th className="pb-2">Demo profile</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const name = [u.firstName, u.lastName].filter(Boolean).join(' ') || '—'
                return (
                  <tr key={u.userId} className="border-t border-slate-100">
                    <td className="py-2">{name}</td>
                    <td className="py-2 text-slate-500">{u.email}</td>
                    <td className="py-2">{u.phone || '—'}</td>
                    <td className="py-2">{[u.city, u.country].filter(Boolean).join(', ') || '—'}</td>
                    <td className="py-2 text-slate-500">
                      {[u.dateOfBirth, u.addressLine1].filter(Boolean).join(' · ') || 'Profile only'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </section>

      <TellerDeposit />
      <AuditLog />
    </AppLayout>
  )
}

type CustomerFormState = Required<Omit<CreateCustomerPayload, 'openingDeposit'>> & { openingDeposit: string }

function CreateCustomerForm() {
  const qc = useQueryClient()
  const [form, setForm] = useState<CustomerFormState>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    dateOfBirth: '',
    phone: '',
    addressLine1: '',
    city: '',
    country: 'India',
    bankName: 'SBI',
    accountType: 'SAVINGS',
    openingDeposit: '25000',
  })
  const [message, setMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  const createM = useMutation({
    mutationFn: () => createCustomer({
      ...form,
      openingDeposit: Number(form.openingDeposit || 0),
      dateOfBirth: form.dateOfBirth || undefined,
      phone: form.phone || undefined,
      addressLine1: form.addressLine1 || undefined,
      city: form.city || undefined,
      country: form.country || undefined,
    }),
    onSuccess: (customer) => {
      qc.invalidateQueries({ queryKey: ['admin-users'] })
      qc.invalidateQueries({ queryKey: ['admin-accounts'] })
      setMessage({ kind: 'ok', text: `Created ${customer.firstName} ${customer.lastName} and their ${BANK_LABELS[form.bankName]} account.` })
      setForm((current) => ({
        ...current,
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        dateOfBirth: '',
        phone: '',
        addressLine1: '',
        city: '',
      }))
    },
    onError: (error) => setMessage({ kind: 'err', text: apiErrorMessage(error) }),
  })

  function update<K extends keyof CustomerFormState>(key: K, value: CustomerFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)
    createM.mutate()
  }

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
      <h2 className="text-lg font-semibold">Add a customer</h2>
      <p className="mt-1 text-sm text-slate-500">Create a login, record fictional profile details, and open an INR account with an optional opening deposit.</p>
      <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-2">
        <CustomerInput label="First name" required value={form.firstName} onChange={(value) => update('firstName', value)} />
        <CustomerInput label="Last name" required value={form.lastName} onChange={(value) => update('lastName', value)} />
        <CustomerInput label="Email" type="email" required value={form.email} onChange={(value) => update('email', value)} />
        <CustomerInput label="Temporary password (8+ characters)" type="password" minLength={8} required value={form.password} onChange={(value) => update('password', value)} />
        <CustomerInput label="Date of birth" type="date" value={form.dateOfBirth} onChange={(value) => update('dateOfBirth', value)} />
        <CustomerInput label="Phone" value={form.phone} onChange={(value) => update('phone', value)} />
        <CustomerInput label="Address" value={form.addressLine1} onChange={(value) => update('addressLine1', value)} />
        <CustomerInput label="City" value={form.city} onChange={(value) => update('city', value)} />
        <CustomerInput label="Country" value={form.country} onChange={(value) => update('country', value)} />
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Bank</span>
          <select value={form.bankName} onChange={(event) => update('bankName', event.target.value as DemoBank)} className="w-full rounded-lg border border-slate-300 px-3 py-2">
            {Object.entries(BANK_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Account type</span>
          <select value={form.accountType} onChange={(event) => update('accountType', event.target.value as AccountType)} className="w-full rounded-lg border border-slate-300 px-3 py-2">
            <option value="SAVINGS">Savings</option>
            <option value="CHECKING">Checking</option>
          </select>
        </label>
        <CustomerInput label="Opening deposit (INR)" type="number" min="0" step="0.01" value={form.openingDeposit} onChange={(value) => update('openingDeposit', value)} />
        <div className="flex items-end">
          <button type="submit" disabled={createM.isPending} className="rounded-lg bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-800 disabled:opacity-60">
            {createM.isPending ? 'Creating…' : 'Create customer and account'}
          </button>
        </div>
      </form>
      {message && <p className={`mt-3 text-sm ${message.kind === 'ok' ? 'text-green-700' : 'text-red-600'}`}>{message.text}</p>}
    </section>
  )
}

function CustomerInput({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
  min,
  minLength,
  step,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  required?: boolean
  min?: string
  minLength?: number
  step?: string
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        min={min}
        minLength={minLength}
        step={step}
        className="w-full rounded-lg border border-slate-300 px-3 py-2"
      />
    </label>
  )
}

function TellerDeposit() {
  const qc = useQueryClient()
  const { data } = useQuery({ queryKey: ['admin-accounts'], queryFn: listAdminAccounts })
  const [amounts, setAmounts] = useState<Record<string, string>>({})
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  const depositM = useMutation({
    mutationFn: ({ number, amount }: { number: string; amount: number }) => tellerDeposit(number, amount),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['admin-accounts'] })
      setAmounts((a) => ({ ...a, [vars.number]: '' }))
      setMsg({ kind: 'ok', text: `Deposited to ${vars.number}` })
    },
    onError: (e) => setMsg({ kind: 'err', text: apiErrorMessage(e) }),
  })

  const accounts = data ?? []

  return (
    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
      <h2 className="text-lg font-semibold">Teller deposit</h2>
      <p className="mt-1 text-sm text-slate-500">Record a cash deposit into a customer's account.</p>
      <div className="mt-4 space-y-2">
        {accounts.length === 0 && <p className="text-sm text-slate-500">No customer accounts yet.</p>}
        {accounts.map((a) => (
          <div key={a.accountNumber} className="flex items-center justify-between rounded-lg border border-slate-200 p-3 text-sm">
            <span>
              <span className="font-mono">{a.accountNumber}</span> · {a.bankName} {a.type} ·{' '}
              <span className="text-slate-500">{a.ownerEmail}</span> · {formatMoney(a.balance, a.currency)}
            </span>
            <span className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                step="0.01"
                value={amounts[a.accountNumber] ?? ''}
                onChange={(e) => setAmounts((m) => ({ ...m, [a.accountNumber]: e.target.value }))}
                placeholder="0.00"
                className="w-28 rounded-lg border border-slate-300 px-2 py-1.5"
              />
              <button
                onClick={() =>
                  depositM.mutate({ number: a.accountNumber, amount: Number(amounts[a.accountNumber]) })
                }
                disabled={!(Number(amounts[a.accountNumber]) > 0) || depositM.isPending}
                className="rounded-lg bg-green-600 px-3 py-1.5 font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                Deposit
              </button>
            </span>
          </div>
        ))}
      </div>
      {msg && <p className={`mt-2 text-sm ${msg.kind === 'ok' ? 'text-green-600' : 'text-red-600'}`}>{msg.text}</p>}
    </section>
  )
}

function AuditLog() {
  const { data, isLoading } = useQuery({ queryKey: ['admin-audit'], queryFn: () => listAudit(50) })
  const entries = data ?? []

  return (
    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
      <h2 className="text-lg font-semibold">Audit log</h2>
      <p className="mt-1 text-sm text-slate-500">Recent domain events (append-only).</p>
      {isLoading ? (
        <p className="mt-3 text-slate-500">Loading…</p>
      ) : entries.length === 0 ? (
        <p className="mt-3 text-slate-500">No audit entries yet.</p>
      ) : (
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="text-left text-slate-400">
              <th className="pb-2">Time</th>
              <th className="pb-2">Action</th>
              <th className="pb-2">Entity</th>
              <th className="pb-2">Detail</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id} className="border-t border-slate-100">
                <td className="py-1.5 text-slate-500">{formatDateTime(e.createdAt)}</td>
                <td className="py-1.5 font-medium">{e.action}</td>
                <td className="py-1.5 text-slate-500">{e.entityType}</td>
                <td className="py-1.5">{e.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}
