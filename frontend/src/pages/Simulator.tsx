import { useState, useEffect } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { useFinanceStore } from '../store/useFinanceStore'
import { profileApi } from '../services/api'
import type { Debt } from '../store/useFinanceStore'

export default function Simulator() {
  const { debts, token } = useFinanceStore()
  const [selectedDebtId, setSelectedDebtId] = useState<number | null>(null)
  const [projection, setProjection] = useState<{ month: number; balance: number; interest: number }[]>([])
  const [payoff, setPayoff] = useState<number | null>(null)

  useEffect(() => {
    if (!token || !selectedDebtId) {
      setProjection([])
      setPayoff(null)
      return
    }
    Promise.all([
      profileApi.getProjection(selectedDebtId),
      profileApi.getPayoff(selectedDebtId),
    ]).then(([projRes, payoffRes]) => {
      setProjection(projRes.data)
      setPayoff(payoffRes.data.months_to_payoff)
    })
  }, [token, selectedDebtId])

  const chartData = projection.map((p) => ({
    month: p.month,
    balance: Number(p.balance),
    interest: Number(p.interest),
  }))

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Debt Simulator</h1>
        <p className="mt-1 text-slate-600 text-sm">12‑month payoff projection</p>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">12‑month projection</h2>
        {token && (debts?.length ?? 0) > 0 ? (
          <>
            <label className="block text-sm font-medium text-slate-700 mb-2">Select debt</label>
            <select
              value={selectedDebtId ?? ''}
              onChange={(e) => setSelectedDebtId(e.target.value ? Number(e.target.value) : null)}
              className="input mb-4 max-w-xs"
            >
              <option value="">-- Choose --</option>
              {debts?.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} (${Number(d.balance).toLocaleString()})
                </option>
              ))}
            </select>
            {payoff !== null && (
              <p className="text-slate-600 mb-4">
                Months to payoff:{' '}
                <span className="font-medium text-slate-800">
                  {payoff === Infinity ? 'Never (payment ≤ interest)' : payoff}
                </span>
              </p>
            )}
            {chartData.length > 0 && (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(v) => `$${v}`} />
                    <Tooltip
                      formatter={(v: number) => [`$${v.toFixed(2)}`, '']}
                      labelFormatter={(l) => `Month ${l}`}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="balance" stroke="#059669" name="Balance" />
                    <Line type="monotone" dataKey="interest" stroke="#0d9488" name="Interest" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        ) : (
          <p className="text-slate-500 text-sm">
            Sign in and add at least one debt in Profile to see the projection chart.
          </p>
        )}
      </div>
    </div>
  )
}
