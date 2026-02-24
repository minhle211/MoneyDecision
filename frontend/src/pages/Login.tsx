import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  OAuthProvider,
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

  const exchangeFirebaseToken = async (cred: UserCredential) => {
    const idToken = await cred.user.getIdToken()
    const res = await authApi.firebaseLogin(idToken)
    const token = res.data?.access_token
    if (token) {
      setToken(token)
      navigate('/dashboard')
    } else {
      setError('Backend did not return a token. Ensure Firebase is configured on the backend.')
    }
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
      await exchangeFirebaseToken(cred)
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

  const signInWithProvider = async (providerName: 'google' | 'github' | 'facebook') => {
    const auth = getFirebaseAuth()
    if (!auth) return
    setError('')
    setFirebaseLoading(true)
    try {
      let provider: GoogleAuthProvider | GithubAuthProvider | OAuthProvider
      if (providerName === 'google') provider = new GoogleAuthProvider()
      else if (providerName === 'github') provider = new GithubAuthProvider()
      else provider = new OAuthProvider('facebook.com')
      const cred = await signInWithPopup(auth, provider)
      await exchangeFirebaseToken(cred)
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'code' in err) {
        const code = (err as { code: string }).code
        if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') setError('')
        else setError(err instanceof Error ? err.message : 'Sign-in failed.')
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
                <p className="text-xs text-slate-500 pt-1">Or continue with:</p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => signInWithProvider('google')}
                    disabled={firebaseLoading}
                    className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                    Google
                  </button>
                  <button
                    type="button"
                    onClick={() => signInWithProvider('github')}
                    disabled={firebaseLoading}
                    className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"/></svg>
                    GitHub
                  </button>
                  <button
                    type="button"
                    onClick={() => signInWithProvider('facebook')}
                    disabled={firebaseLoading}
                    className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    <svg className="h-5 w-5" fill="#1877F2" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    Facebook
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
