import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AxiosError } from 'axios'
import { useAuth } from '../context/AuthContext'
import { apiErrorMessage } from '../lib/errors'
import { AuthShell, Field } from './LoginPage'

export default function SignupPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }))

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match. Please enter the same password in both fields.')
      return
    }
    setSubmitting(true)
    try {
      await register({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        password: form.password,
      })
      navigate('/')
    } catch (err) {
      setError(
        err instanceof AxiosError && err.response?.status === 409
          ? 'This email is already registered. Sign in with that account or use a different email.'
          : apiErrorMessage(err, 'Could not create your account. Please check your details and try again.'),
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell title="Create a demo profile" subtitle="Create a fictional simulator account">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="First name" value={form.firstName} onChange={set('firstName')} autoComplete="given-name" />
          <Field label="Last name" value={form.lastName} onChange={set('lastName')} autoComplete="family-name" />
        </div>
        <Field
          label="Email"
          type="email"
          value={form.email}
          onChange={set('email')}
          autoComplete="email"
          autoCapitalize="none"
        />
        <Field
          label="Password (min 8 chars)"
          type="password"
          value={form.password}
          onChange={set('password')}
          autoComplete="new-password"
        />
        <Field
          label="Confirm password"
          type="password"
          value={form.confirmPassword}
          onChange={set('confirmPassword')}
          autoComplete="new-password"
        />
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-slate-900 py-2.5 font-medium text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {submitting ? 'Creating…' : 'Create account'}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-slate-900 hover:underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  )
}
