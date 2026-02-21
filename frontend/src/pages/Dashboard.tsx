import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useFinanceStore } from '../store/useFinanceStore'
import { profileApi } from '../services/api'

export default function Dashboard() {
  const { income, expenses, debts, setProfile, setDebts, token } = useFinanceStore()
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
        const p = res.data
        setProfile({
          income: Number(p.monthly_income) || 0,
          expenses: Number(p.fixed_costs) || 0,
        })
        setDebts(p.debts || [])
        return profileApi.getAllocation()
      })
      .then((res) => {
        setAllocation(res.data)
        return profileApi.getMentorNote()
      })
      .then((res) => setMentorNote(res.data?.note ?? null))
      .catch(() => setAllocation(null))
      .finally(() => setLoading(false))
  }, [token, setProfile, setDebts])

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
      <h1 className="text-2xl font-semibold text-slate-800">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border border-slate-200">
          <p className="text-sm text-slate-500">Monthly Income</p>
          <p className="text-xl font-semibold text-emerald-700">${income.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border border-slate-200">
          <p className="text-sm text-slate-500">Fixed Costs</p>
          <p className="text-xl font-semibold text-slate-800">${expenses.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border border-slate-200">
          <p className="text-sm text-slate-500">Debts</p>
          <p className="text-xl font-semibold text-slate-800">{debts.length}</p>
        </div>
      </div>

      {allocationData.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4 border border-slate-200">
          <h2 className="text-lg font-medium text-slate-800 mb-4">50/30/20 Allocation</h2>
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

      {mentorNote && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <h2 className="text-lg font-medium text-emerald-800 mb-2">Mentor note</h2>
          <p className="text-slate-700">{mentorNote}</p>
        </div>
      )}

      {!token && (
        <p className="text-slate-500">
          Sign in and set your profile to see allocation and charts.
        </p>
      )}
    </div>
  )
}
