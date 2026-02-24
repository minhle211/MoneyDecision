import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { getFirebaseAuth } from '../lib/firebase'
import { useFinanceStore } from '../store/useFinanceStore'

const nav = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/profile', label: 'Profile' },
  { to: '/goals', label: 'Goals' },
  { to: '/scenarios', label: 'Scenarios' },
  { to: '/simulator', label: 'Simulator' },
]

export default function Layout() {
  const token = useFinanceStore((s) => s.token)
  const setToken = useFinanceStore((s) => s.setToken)
  const navigate = useNavigate()

  const logout = () => {
    const auth = getFirebaseAuth()
    if (auth?.currentUser) auth.signOut()
    setToken(null)
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-slate-900 text-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="text-xl font-semibold tracking-tight">FinBud</span>
          <nav className="flex gap-1 items-center">
            {nav.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
            {token ? (
              <button
                onClick={logout}
                className="ml-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
              >
                Sign out
              </button>
            ) : (
              <NavLink
                to="/login"
                className="ml-2 px-3 py-2 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
              >
                Sign in
              </NavLink>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
