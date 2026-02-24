import { useState, useEffect } from 'react'
import { XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, LineChart, Line, CartesianGrid } from 'recharts'
import { useFinanceStore } from '../store/useFinanceStore'
import { profileApi, scenariosApi } from '../services/api'

type ScenarioType = 'debt-extra' | 'invest' | 'saving-rate'

export default function Scenarios() {
  const { token, debts, goals, income, currentSavings, setDebts, setGoals, setProfile } = useFinanceStore()
  const [scenarioType, setScenarioType] = useState<ScenarioType>('debt-extra')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Record<string, unknown> | null>(null)
  const [error, setError] = useState('')

  // Debt extra form
  const [debtId, setDebtId] = useState<number | ''>('')
  const [extraMonthly, setExtraMonthly] = useState('')
  const [debtMonths, setDebtMonths] = useState('12')

  // Invest form
  const [investMonthly, setInvestMonthly] = useState('')
  const [investReturnPct, setInvestReturnPct] = useState('7')
  const [investMonths, setInvestMonths] = useState('36')

  // Saving rate form
  const [goalId, setGoalId] = useState<number | ''>('')
  const [currentRate, setCurrentRate] = useState('10')
  const [newRate, setNewRate] = useState('20')

  useEffect(() => {
    if (!token) return
    profileApi.getMe().then((res) => {
      const p = res.data as { monthly_income?: number; fixed_costs?: number; current_savings?: number; debts?: unknown[]; goals?: { id: number; name: string; goal_type: string; target_amount: number; target_months?: number }[] }
      setProfile({
        income: Number(p.monthly_income) || 0,
        expenses: Number(p.fixed_costs) || 0,
        currentSavings: Number(p.current_savings) || 0,
      })
      setDebts(p.debts || [])
      setGoals(p.goals || [])
    })
  }, [token, setProfile, setDebts, setGoals])

  const runScenario = () => {
    setError('')
    setResult(null)
    setLoading(true)
    if (scenarioType === 'debt-extra') {
      if (!debtId || !extraMonthly) {
        setError('Chọn nợ và số tiền trả thêm.')
        setLoading(false)
        return
      }
      scenariosApi
        .debtExtra({
          debt_id: Number(debtId),
          extra_monthly: Number(extraMonthly),
          months: Number(debtMonths) || 12,
        })
        .then((res) => setResult(res.data as Record<string, unknown>))
        .catch((e) => setError(e.response?.data?.detail || 'Failed'))
        .finally(() => setLoading(false))
    } else if (scenarioType === 'invest') {
      if (!investMonthly) {
        setError('Nhập số tiền đầu tư mỗi tháng.')
        setLoading(false)
        return
      }
      scenariosApi
        .invest({
          monthly_amount: Number(investMonthly),
          annual_return_pct: Number(investReturnPct) || 7,
          months: Number(investMonths) || 36,
        })
        .then((res) => setResult(res.data as Record<string, unknown>))
        .catch((e) => setError(e.response?.data?.detail || 'Failed'))
        .finally(() => setLoading(false))
    } else {
      if (!goalId || !income) {
        setError('Chọn goal và đảm bảo đã nhập thu nhập trong Profile.')
        setLoading(false)
        return
      }
      scenariosApi
        .savingRate({
          current_saving_rate_pct: Number(currentRate) || 10,
          new_saving_rate_pct: Number(newRate) || 20,
          goal_id: Number(goalId),
          monthly_income: income,
          current_savings: currentSavings ?? 0,
        })
        .then((res) => setResult(res.data as Record<string, unknown>))
        .catch((e) => setError(e.response?.data?.detail || 'Failed'))
        .finally(() => setLoading(false))
    }
  }

  const debtComparisonData =
    result && scenarioType === 'debt-extra' && result.baseline_timeline && result.scenario_timeline
      ? (result.baseline_timeline as { month: number; balance: number }[]).map((b, i) => ({
          month: b.month,
          'Baseline (current)': Number(b.balance ?? 0),
          'With extra payment': Number((result.scenario_timeline as { balance: number }[])[i]?.balance ?? 0),
        }))
      : []

  const investTimelineData =
    result && scenarioType === 'invest' && result.timeline
      ? (result.timeline as { month: number; balance: number; total_contributed: number }[]).map((t) => ({
          month: t.month,
          balance: Number(t.balance),
          contributed: Number(t.total_contributed),
        }))
      : []

  const savingRateComparisonData =
    result && scenarioType === 'saving-rate' && result.baseline_timeline && result.scenario_timeline
      ? [
          ...(result.baseline_timeline as { month: number; balance: number }[]).map((b, i) => ({
            month: b.month,
            'Current rate': Number((b as { balance: number }).balance),
            'New rate': Number((result.scenario_timeline as { balance: number }[])[i]?.balance ?? 0),
          })),
        ]
      : []

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Scenarios</h1>
        <p className="mt-1 text-slate-600 text-sm">
          So sánh: trả thêm nợ, đầu tư ETF, hoặc tăng saving rate — xem timeline và trade-offs
        </p>
      </div>

      {!token ? (
        <p className="text-slate-500 text-sm">Sign in to run scenarios.</p>
      ) : (
        <>
          <section className="card">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Chọn scenario</h2>
            <div className="flex flex-wrap gap-2 mb-4">
              {(
                [
                  { id: 'debt-extra', label: 'Trả thêm vào nợ (debt extra)' },
                  { id: 'invest', label: 'Đầu tư ETF mỗi tháng' },
                  { id: 'saving-rate', label: 'Tăng saving rate (goal)' },
                ] as const
              ).map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => {
                    setScenarioType(id)
                    setResult(null)
                    setError('')
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    scenarioType === id ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {scenarioType === 'debt-extra' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Chọn nợ</label>
                  <select
                    value={debtId}
                    onChange={(e) => setDebtId(e.target.value ? Number(e.target.value) : '')}
                    className="input"
                  >
                    <option value="">-- Chọn --</option>
                    {(debts || []).map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} (${Number(d.balance).toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Trả thêm mỗi tháng ($)</label>
                  <input
                    type="number"
                    value={extraMonthly}
                    onChange={(e) => setExtraMonthly(e.target.value)}
                    className="input"
                    placeholder="2000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Số tháng xem</label>
                  <input
                    type="number"
                    value={debtMonths}
                    onChange={(e) => setDebtMonths(e.target.value)}
                    className="input"
                    placeholder="12"
                  />
                </div>
              </div>
            )}

            {scenarioType === 'invest' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Đầu tư mỗi tháng ($)</label>
                  <input
                    type="number"
                    value={investMonthly}
                    onChange={(e) => setInvestMonthly(e.target.value)}
                    className="input"
                    placeholder="3000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Lợi nhuận năm (%)</label>
                  <input
                    type="number"
                    value={investReturnPct}
                    onChange={(e) => setInvestReturnPct(e.target.value)}
                    className="input"
                    placeholder="7"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Số tháng</label>
                  <input
                    type="number"
                    value={investMonths}
                    onChange={(e) => setInvestMonths(e.target.value)}
                    className="input"
                    placeholder="36"
                  />
                </div>
              </div>
            )}

            {scenarioType === 'saving-rate' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Goal</label>
                  <select
                    value={goalId}
                    onChange={(e) => setGoalId(e.target.value ? Number(e.target.value) : '')}
                    className="input"
                  >
                    <option value="">-- Chọn --</option>
                    {(goals || []).map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} (${Number(g.target_amount).toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Saving rate hiện tại (%)</label>
                  <input
                    type="number"
                    value={currentRate}
                    onChange={(e) => setCurrentRate(e.target.value)}
                    className="input"
                    placeholder="10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Saving rate mới (%)</label>
                  <input
                    type="number"
                    value={newRate}
                    onChange={(e) => setNewRate(e.target.value)}
                    className="input"
                    placeholder="20"
                  />
                </div>
              </div>
            )}

            <button onClick={runScenario} disabled={loading} className="btn-primary mt-4">
              {loading ? 'Đang tính...' : 'Chạy scenario'}
            </button>
          </section>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-2 text-sm text-red-700">{error}</div>
          )}

          {result && (
            <section className="card">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Kết quả</h2>
              {scenarioType === 'debt-extra' && (
                <>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="card-header">Baseline: months to payoff</p>
                      <p className="card-value">
                        {typeof result.baseline_months_to_payoff === 'number' && result.baseline_months_to_payoff === Infinity
                          ? 'Never'
                          : result.baseline_months_to_payoff}
                      </p>
                    </div>
                    <div>
                      <p className="card-header">With extra: months to payoff</p>
                      <p className="card-value text-emerald-600">
                        {typeof result.scenario_months_to_payoff === 'number' && result.scenario_months_to_payoff === Infinity
                          ? 'Never'
                          : result.scenario_months_to_payoff}
                      </p>
                    </div>
                    {result.interest_saved != null && (
                      <div>
                        <p className="card-header">Interest saved ($)</p>
                        <p className="card-value">${Number(result.interest_saved).toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                  {debtComparisonData.length > 0 && (
                    <div className="h-80 mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={debtComparisonData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis tickFormatter={(v) => `$${v}`} />
                          <Tooltip formatter={(v: number) => [`$${Number(v).toLocaleString()}`, '']} />
                          <Legend />
                          <Line type="monotone" dataKey="Baseline (current)" stroke="#94a3b8" />
                          <Line type="monotone" dataKey="With extra payment" stroke="#059669" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </>
              )}
              {scenarioType === 'invest' && (
                <>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="card-header">Final balance ($)</p>
                      <p className="card-value text-emerald-600">
                        ${Number(result.final_balance).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="card-header">Total contributed ($)</p>
                      <p className="card-value">${Number(result.total_contributed).toLocaleString()}</p>
                    </div>
                  </div>
                  {investTimelineData.length > 0 && (
                    <div className="h-80 mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={investTimelineData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis tickFormatter={(v) => `$${v}`} />
                          <Tooltip formatter={(v: number) => [`$${Number(v).toLocaleString()}`, '']} />
                          <Legend />
                          <Line type="monotone" dataKey="balance" stroke="#059669" name="Balance" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </>
              )}
              {scenarioType === 'saving-rate' && (
                <>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="card-header">Current rate: months to goal</p>
                      <p className="card-value">
                        {typeof result.baseline_months_to_goal === 'number' && result.baseline_months_to_goal === Infinity
                          ? 'Never'
                          : result.baseline_months_to_goal}
                      </p>
                    </div>
                    <div>
                      <p className="card-header">New rate: months to goal</p>
                      <p className="card-value text-emerald-600">
                        {typeof result.scenario_months_to_goal === 'number' && result.scenario_months_to_goal === Infinity
                          ? 'Never'
                          : result.scenario_months_to_goal}
                      </p>
                    </div>
                    <div>
                      <p className="card-header">Target ($)</p>
                      <p className="card-value">${Number(result.target_amount).toLocaleString()}</p>
                    </div>
                  </div>
                  {savingRateComparisonData.length > 0 && (
                    <div className="h-80 mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={savingRateComparisonData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis tickFormatter={(v) => `$${v}`} />
                          <Tooltip formatter={(v: number) => [`$${Number(v).toLocaleString()}`, '']} />
                          <Legend />
                          <Line type="monotone" dataKey="Current rate" stroke="#94a3b8" />
                          <Line type="monotone" dataKey="New rate" stroke="#059669" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </>
              )}
            </section>
          )}
        </>
      )}
    </div>
  )
}
