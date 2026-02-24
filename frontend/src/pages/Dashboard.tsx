import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useFinanceStore } from '../store/useFinanceStore'
import { profileApi } from '../services/api'

export default function Dashboard() {
  const { income, expenses, currentSavings, debts, goals, setProfile, setDebts, setGoals, token } = useFinanceStore()
  const [allocation, setAllocation] = useState<{ needs: number; wants: number; savings: number } | null>(null)
  const [mentorNote, setMentorNote] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }
    profileApi
      .getMe()
      .then((res) => {
        const p = res.data as { monthly_income?: number; fixed_costs?: number; current_savings?: number; debts?: unknown[]; goals?: { id: number; name: string; goal_type: string; target_amount: number; target_months?: number }[] }
        setProfile({
          income: Number(p.monthly_income) || 0,
          expenses: Number(p.fixed_costs) || 0,
          currentSavings: Number(p.current_savings) || 0,
        })
        setDebts(p.debts || [])
        setGoals(p.goals || [])
        return profileApi.getAllocation()
      })
      .then((res) => {
        setAllocation(res.data)
        return profileApi.getMentorNote()
      })
      .then((res) => setMentorNote(res.data?.note ?? null))
      .catch(() => setAllocation(null))
      .finally(() => setLoading(false))
  }, [token, setProfile, setDebts, setGoals])

  if (loading) {
    return <div className="text-slate-500">Loading...</div>
  }

  const allocationData = allocation
    ? [
        { name: 'Needs (50%)', value: allocation.needs, fill: '#059669' },
        { name: 'Wants (30%)', value: allocation.wants, fill: '#0d9488' },
        { name: 'Savings (20%)', value: allocation.savings, fill: '#10b981' },
      ]
    : []

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
        <p className="mt-1 text-slate-600 text-sm">Your money at a glance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <p className="card-header">Monthly Income</p>
          <p className="card-value text-emerald-600">${income.toLocaleString()}</p>
        </div>
        <div className="card">
          <p className="card-header">Fixed Costs</p>
          <p className="card-value">${expenses.toLocaleString()}</p>
        </div>
        <div className="card">
          <p className="card-header">Current Savings</p>
          <p className="card-value">${(currentSavings ?? 0).toLocaleString()}</p>
        </div>
        <div className="card">
          <p className="card-header">Debts</p>
          <p className="card-value">{debts.length}</p>
        </div>
      </div>

      {(goals?.length ?? 0) > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Goals</h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(goals || []).map((g) => (
              <li key={g.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <span className="font-medium text-slate-800">{g.name}</span>
                <span className="text-slate-600 tabular-nums">${Number(g.target_amount).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {allocationData.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">50/30/20 Allocation</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={allocationData} layout="vertical" margin={{ left: 80 }}>
                <XAxis type="number" tickFormatter={(v) => `$${v}`} />
                <YAxis type="category" dataKey="name" width={100} />
                <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, '']} />
                <Legend />
                <Bar dataKey="value" name="Amount" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {token && income > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-slate-800 mb-2">12-month outlook</h2>
          <p className="text-slate-600 text-sm mb-2">Dự đoán thu chi (giả định không đổi)</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="card-header">Projected income (12 mo)</p>
              <p className="card-value text-emerald-600">${(income * 12).toLocaleString()}</p>
            </div>
            <div>
              <p className="card-header">Projected costs (12 mo)</p>
              <p className="card-value">${(expenses * 12).toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      {mentorNote && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-5">
          <h2 className="text-lg font-semibold text-emerald-800 mb-2">Mentor note</h2>
          <p className="text-slate-700 leading-relaxed">{mentorNote}</p>
        </div>
      )}

      {!token && (
        <p className="text-slate-500 text-sm">
          Sign in and set your profile to see allocation and charts.
        </p>
      )}
    </div>
  )
}
