import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../services/api'
import { useFinanceStore } from '../store/useFinanceStore'

export default function Login() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const setToken = useFinanceStore((s) => s.setToken)

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
      .catch((err) => {
        const detail = err.response?.data?.detail
        let msg: string
        if (typeof detail === 'string') {
          msg = detail
        } else if (Array.isArray(detail)) {
          msg = detail.map((d: { msg?: string }) => d?.msg ?? '').filter(Boolean).join(' ') || 'Request failed'
        } else if (err.code === 'ERR_NETWORK') {
          msg = 'Cannot reach backend. Start it from the backend folder or use Docker.'
        } else if (err.response?.status) {
          const d = err.response?.data?.detail
          msg = typeof d === 'string' ? d : `Request failed (${err.response.status})`
        } else {
          msg = err.message || 'Request failed'
        }
        setError(msg)
      })
      .finally(() => setLoading(false))
  }

  return (
    <div className="max-w-md mx-auto mt-12 bg-white rounded-lg shadow p-6 border border-slate-200">
      <h1 className="text-xl font-semibold text-slate-800 mb-4">
        {mode === 'login' ? 'Sign in' : 'Create account'}
      </h1>
      {error && (
        <p className="mb-4 text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>
      )}
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-slate-600 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-slate-300 rounded px-3 py-2"
          />
        </div>
        {mode === 'register' && (
          <div>
            <label className="block text-sm text-slate-600 mb-1">Display name (optional)</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full border border-slate-300 rounded px-3 py-2"
            />
          </div>
        )}
        <div>
          <label className="block text-sm text-slate-600 mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-slate-300 rounded px-3 py-2"
          />
        </div>
        <button
          onClick={submit}
          disabled={loading}
          className="w-full py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Register'}
        </button>
        <button
          type="button"
          onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}
          className="w-full text-sm text-emerald-700 hover:underline"
        >
          {mode === 'login' ? 'Need an account? Register' : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  )
}
