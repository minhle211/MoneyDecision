import { useEffect, useState } from 'react'
import { useFinanceStore } from '../store/useFinanceStore'
import { profileApi } from '../services/api'
import type { Debt } from '../store/useFinanceStore'

export default function Profile() {
  const { income, expenses, setProfile, debts, setDebts, token } = useFinanceStore()
  const [localIncome, setLocalIncome] = useState('')
  const [localExpenses, setLocalExpenses] = useState('')
  const [saving, setSaving] = useState(false)
  const [debtForm, setDebtForm] = useState({ name: '', balance: '', apr: '', monthly_payment: '' })
  const [addingDebt, setAddingDebt] = useState(false)

  useEffect(() => {
    setLocalIncome(String(income || ''))
    setLocalExpenses(String(expenses || ''))
  }, [income, expenses])

  useEffect(() => {
    if (!token) return
    profileApi.getMe().then((res) => {
      const p = res.data
      setProfile({
        income: Number(p.monthly_income) || 0,
        expenses: Number(p.fixed_costs) || 0,
      })
      setDebts(p.debts || [])
    })
  }, [token, setProfile, setDebts])

  const handleSaveProfile = () => {
    if (!token) return
    setSaving(true)
    profileApi
      .updateMe({
        monthly_income: localIncome ? Number(localIncome) : undefined,
        fixed_costs: localExpenses ? Number(localExpenses) : undefined,
      })
      .then(() => setSaving(false))
      .catch(() => setSaving(false))
  }

  const handleAddDebt = () => {
    if (!token || !debtForm.name || !debtForm.balance || !debtForm.apr || !debtForm.monthly_payment)
      return
    setAddingDebt(true)
    profileApi
      .addDebt({
        name: debtForm.name,
        balance: Number(debtForm.balance),
        apr: Number(debtForm.apr),
        monthly_payment: Number(debtForm.monthly_payment),
      })
      .then((res) => {
        useFinanceStore.getState().addDebt(res.data)
        setDebts([...(debts || []), res.data])
        setDebtForm({ name: '', balance: '', apr: '', monthly_payment: '' })
      })
      .finally(() => setAddingDebt(false))
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Profile</h1>
        <p className="mt-1 text-slate-600 text-sm">Income, costs, and debts</p>
      </div>

      <section className="card">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Income & Costs</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Monthly Income ($)</label>
            <input
              type="number"
              value={localIncome}
              onChange={(e) => setLocalIncome(e.target.value)}
              className="input"
              placeholder="5000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Fixed Costs ($)</label>
            <input
              type="number"
              value={localExpenses}
              onChange={(e) => setLocalExpenses(e.target.value)}
              className="input"
              placeholder="2000"
            />
          </div>
        </div>
        {token && (
          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="btn-primary mt-4"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        )}
      </section>

      <section className="card">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Debts</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <input
            placeholder="Name (e.g. Credit Card)"
            value={debtForm.name}
            onChange={(e) => setDebtForm((f) => ({ ...f, name: e.target.value }))}
            className="input"
          />
          <input
            type="number"
            placeholder="Balance"
            value={debtForm.balance}
            onChange={(e) => setDebtForm((f) => ({ ...f, balance: e.target.value }))}
            className="input"
          />
          <input
            type="number"
            placeholder="APR %"
            value={debtForm.apr}
            onChange={(e) => setDebtForm((f) => ({ ...f, apr: e.target.value }))}
            className="input"
          />
          <input
            type="number"
            placeholder="Monthly payment"
            value={debtForm.monthly_payment}
            onChange={(e) => setDebtForm((f) => ({ ...f, monthly_payment: e.target.value }))}
            className="input"
          />
        </div>
        {token && (
          <button
            onClick={handleAddDebt}
            disabled={addingDebt}
            className="btn-primary"
          >
            {addingDebt ? 'Adding...' : 'Add Debt'}
          </button>
        )}
        <ul className="mt-4 space-y-2">
          {(debts || []).map((d: Debt) => (
            <li
              key={d.id ?? d.name}
              className="flex justify-between items-center py-3 border-b border-slate-100 last:border-0"
            >
              <span className="font-medium text-slate-800">{d.name}</span>
              <span className="text-slate-600 tabular-nums">
                ${Number(d.balance).toLocaleString()} @ {d.apr}% APR
              </span>
            </li>
          ))}
        </ul>
      </section>

      {!token && (
        <p className="text-slate-500 text-sm">Sign in to edit profile and add debts.</p>
      )}
    </div>
  )
}
