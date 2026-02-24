import { useEffect, useState } from 'react'
import { useFinanceStore } from '../store/useFinanceStore'
import { profileApi } from '../services/api'
import type { Goal } from '../store/useFinanceStore'

const GOAL_TYPES = [
  { value: 'house', label: 'Mua nhà / House' },
  { value: 'travel', label: 'Du lịch / Travel' },
  { value: 'retirement', label: 'Hưu trí / Retirement' },
  { value: 'other', label: 'Khác / Other' },
]

export default function Goals() {
  const { goals, setGoals, token } = useFinanceStore()
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', goal_type: 'house', target_amount: '', target_months: '' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }
    profileApi
      .getGoals()
      .then((res) => setGoals(res.data || []))
      .finally(() => setLoading(false))
  }, [token, setGoals])

  const handleAdd = () => {
    if (!token || !form.name || !form.target_amount) return
    setSubmitting(true)
    profileApi
      .addGoal({
        name: form.name,
        goal_type: form.goal_type,
        target_amount: Number(form.target_amount),
        target_months: form.target_months ? Number(form.target_months) : undefined,
      })
      .then((res) => {
        setGoals([...(goals || []), res.data])
        setForm({ name: '', goal_type: 'house', target_amount: '', target_months: '' })
      })
      .finally(() => setSubmitting(false))
  }

  const handleDelete = (goalId: number) => {
    if (!token) return
    profileApi.deleteGoal(goalId).then(() => setGoals((goals || []).filter((g) => g.id !== goalId)))
  }

  if (loading) return <div className="text-slate-500">Loading...</div>

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Goals</h1>
        <p className="mt-1 text-slate-600 text-sm">Mua nhà, du lịch, hưu trí — đặt mục tiêu và theo dõi</p>
      </div>

      {token && (
        <section className="card">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Add goal</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="input"
                placeholder="e.g. Mua nhà, Du lịch Nhật"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
              <select
                value={form.goal_type}
                onChange={(e) => setForm((f) => ({ ...f, goal_type: e.target.value }))}
                className="input"
              >
                {GOAL_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Target amount ($)</label>
              <input
                type="number"
                value={form.target_amount}
                onChange={(e) => setForm((f) => ({ ...f, target_amount: e.target.value }))}
                className="input"
                placeholder="100000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Target months (optional)</label>
              <input
                type="number"
                value={form.target_months}
                onChange={(e) => setForm((f) => ({ ...f, target_months: e.target.value }))}
                className="input"
                placeholder="36"
              />
            </div>
          </div>
          <button onClick={handleAdd} disabled={submitting} className="btn-primary mt-4">
            {submitting ? 'Adding...' : 'Add goal'}
          </button>
        </section>
      )}

      <section className="card">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Your goals</h2>
        {(goals?.length ?? 0) === 0 ? (
          <p className="text-slate-500 text-sm">No goals yet. Add one above.</p>
        ) : (
          <ul className="space-y-3">
            {(goals || []).map((g: Goal) => (
              <li
                key={g.id}
                className="flex justify-between items-center py-3 border-b border-slate-100 last:border-0"
              >
                <div>
                  <span className="font-medium text-slate-800">{g.name}</span>
                  <span className="ml-2 text-slate-500 text-sm capitalize">{g.goal_type}</span>
                  <p className="text-slate-600 text-sm mt-0.5">
                    Target: ${Number(g.target_amount).toLocaleString()}
                    {g.target_months ? ` in ${g.target_months} months` : ''}
                  </p>
                </div>
                {token && (
                  <button
                    onClick={() => handleDelete(g.id)}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Delete
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
