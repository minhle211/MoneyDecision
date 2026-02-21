import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useFinanceStore } from '../store/useFinanceStore'

const nav = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/profile', label: 'Profile' },
  { to: '/simulator', label: 'Simulator' },
]

export default function Layout() {
  const token = useFinanceStore((s) => s.token)
  const setToken = useFinanceStore((s) => s.setToken)
  const navigate = useNavigate()

  const logout = () => {
    setToken(null)
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-emerald-700 text-white shadow">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="text-xl font-semibold">FinBud</span>
          <nav className="flex gap-4 items-center">
            {nav.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded ${isActive ? 'bg-emerald-600' : 'hover:bg-emerald-600/80'}`
                }
              >
                {label}
              </NavLink>
            ))}
            {token ? (
              <button onClick={logout} className="px-3 py-1.5 rounded hover:bg-emerald-600/80 text-sm">
                Sign out
              </button>
            ) : (
              <NavLink to="/login" className="px-3 py-1.5 rounded hover:bg-emerald-600/80">
                Sign in
              </NavLink>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
