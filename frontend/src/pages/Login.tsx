import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  type UserCredential,
} from 'firebase/auth'
import { authApi } from '../services/api'
import { getFirebaseAuth, isFirebaseConfigured } from '../lib/firebase'
import { useFinanceStore } from '../store/useFinanceStore'

export default function Login() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [firebaseLoading, setFirebaseLoading] = useState(false)
  const navigate = useNavigate()
  const setToken = useFinanceStore((s) => s.setToken)

  const setErrorFrom = (err: unknown) => {
    const detail = err && typeof err === 'object' && 'response' in err
      ? (err as { response?: { data?: { detail?: string | unknown } } }).response?.data?.detail
      : null
    let msg: string
    if (typeof detail === 'string') msg = detail
    else if (Array.isArray(detail))
      msg = detail.map((d: { msg?: string }) => d?.msg ?? '').filter(Boolean).join(' ') || 'Request failed'
    else if (err && typeof err === 'object' && 'code' in err && (err as { code: string }).code === 'ERR_NETWORK')
      msg = 'Cannot reach backend. Start it from the backend folder or use Docker.'
    else if (err && typeof err === 'object' && 'response' in err && (err as { response?: { status?: number } }).response?.status)
      msg = `Request failed (${(err as { response: { status: number } }).response.status})`
    else if (err instanceof Error) msg = err.message
    else msg = 'Request failed'
    setError(msg)
  }

  const submit = () => {
    setError('')
    setLoading(true)
    const request =
      mode === 'login'
        ? authApi.login(email, password)
        : authApi.register(email, password, displayName || undefined)
    request
      .then((res) => {
        const token = res.data?.access_token
        if (token) {
          setToken(token)
          navigate('/dashboard')
        } else if (mode === 'register') {
          setMode('login')
          setError('Registered. Please log in.')
        }
      })
      .catch(setErrorFrom)
      .finally(() => setLoading(false))
  }

  const submitFirebase = async () => {
    const auth = getFirebaseAuth()
    if (!auth) return
    setError('')
    setFirebaseLoading(true)
    try {
      let cred: UserCredential
      if (mode === 'register') {
        cred = await createUserWithEmailAndPassword(auth, email, password)
      } else {
        cred = await signInWithEmailAndPassword(auth, email, password)
      }
      const idToken = await cred.user.getIdToken()
      const res = await authApi.firebaseLogin(idToken)
      const token = res.data?.access_token
      if (token) {
        setToken(token)
        navigate('/dashboard')
      } else {
        setError('Backend did not return a token. Ensure Firebase is configured on the backend.')
      }
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'code' in err) {
        const code = (err as { code: string }).code
        if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential')
          setError('Invalid email or password.')
        else if (code === 'auth/email-already-in-use') setError('Email already in use. Sign in instead.')
        else if (code === 'auth/weak-password') setError('Password should be at least 6 characters.')
        else setError(err instanceof Error ? err.message : 'Firebase sign-in failed.')
      } else {
        setErrorFrom(err)
      }
    } finally {
      setFirebaseLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Trust / value prop */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Take control of your money
          </h1>
          <p className="mt-2 text-slate-600 text-sm">
            Track income, debts, and 50/30/20 allocation in one place.
          </p>
          <span className="trust-badge mt-4 inline-flex">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden />
            Secure sign-in
          </span>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-slate-800 mb-5">
            {mode === 'login' ? 'Sign in' : 'Create account'}
          </h2>
          {error && (
            <div
              className="mb-4 rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-sm text-red-700"
              role="alert"
            >
              {error}
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              submit()
            }}
            className="space-y-4"
          >
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="you@example.com"
                required
              />
            </div>
            {mode === 'register' && (
              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-slate-700 mb-1">
                  Display name <span className="text-slate-400">(optional)</span>
                </label>
                <input
                  id="displayName"
                  type="text"
                  autoComplete="name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="input"
                  placeholder="Your name"
                />
              </div>
            )}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="••••••••"
                required
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login')
              setError('')
            }}
            className="mt-4 w-full text-sm text-emerald-700 hover:text-emerald-800 font-medium"
          >
            {mode === 'login' ? 'Need an account? Register' : 'Already have an account? Sign in'}
          </button>

          {isFirebaseConfigured() && (
            <>
              <div className="my-6 flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-xs text-slate-500 font-medium">Or</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>
              <div className="space-y-3">
                <p className="text-sm text-slate-600">Sign in with Firebase (same email/password above)</p>
                <button
                  type="button"
                  onClick={submitFirebase}
                  disabled={firebaseLoading || !email || !password}
                  className="btn-secondary w-full"
                >
                  {firebaseLoading ? 'Please wait...' : mode === 'login' ? 'Sign in with Firebase' : 'Create account with Firebase'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
