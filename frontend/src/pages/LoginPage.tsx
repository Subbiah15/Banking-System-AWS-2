import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AxiosError } from 'axios'
import { useAuth } from '../context/AuthContext'
import { apiErrorMessage } from '../lib/errors'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(email.trim(), password)
      navigate('/')
    } catch (err) {
      setError(
        err instanceof AxiosError && err.response?.status === 401
          ? 'Email or password is incorrect. Check the email you used to create your account, or create a new account.'
          : apiErrorMessage(err, 'Could not sign in. Please try again.'),
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to your simulator profile">
      <form onSubmit={onSubmit} className="space-y-4">
        <Field
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          autoComplete="email"
          autoCapitalize="none"
        />
        <Field
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
        />
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-slate-900 py-2.5 font-medium text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-500">
        No account?{' '}
        <Link to="/signup" className="font-medium text-slate-900 hover:underline">
          Create one
        </Link>
      </p>
    </AuthShell>
  )
}

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight">🏦 {title}</h1>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
          Educational simulator only. Use fictional details; no real money or bank/payment-network services are involved.
        </p>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  )
}

export function Field({
  label,
  type = 'text',
  value,
  onChange,
  autoComplete,
  autoCapitalize,
}: {
  label: string
  type?: string
  value: string
  onChange: (v: string) => void
  autoComplete?: string
  autoCapitalize?: string
}) {
  const [visible, setVisible] = useState(false)
  const isPassword = type === 'password'

  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <div className="relative">
        <input
          type={isPassword && visible ? 'text' : type}
          value={value}
          autoComplete={autoComplete}
          autoCapitalize={autoCapitalize}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 ${isPassword ? 'pr-16' : ''}`}
          required
        />
        {isPassword && (
          <button
            type="button"
            aria-label={visible ? 'Hide password' : 'Show password'}
            aria-pressed={visible}
            onClick={() => setVisible((current) => !current)}
            className="absolute inset-y-0 right-3 text-sm font-medium text-slate-500 hover:text-slate-900"
          >
            {visible ? 'Hide' : 'Show'}
          </button>
        )}
      </div>
    </label>
  )
}
