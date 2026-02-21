import { create } from 'zustand'

export interface Debt {
  id?: number
  name: string
  balance: number
  apr: number
  monthly_payment: number
}

interface FinanceState {
  income: number
  expenses: number
  debts: Debt[]
  token: string | null
  setProfile: (data: { income: number; expenses: number }) => void
  addDebt: (newDebt: Debt) => void
  setDebts: (debts: Debt[]) => void
  setToken: (token: string | null) => void
  reset: () => void
}

export const useFinanceStore = create<FinanceState>((set) => ({
  income: 0,
  expenses: 0,
  debts: [],
  token: typeof localStorage !== 'undefined' ? localStorage.getItem('finbud_token') : null,
  setProfile: (data) =>
    set({
      income: data.income,
      expenses: data.expenses,
    }),
  addDebt: (newDebt) =>
    set((state) => ({
      debts: [...state.debts, newDebt],
    })),
  setDebts: (debts) => set({ debts }),
  setToken: (token) => {
    if (typeof localStorage !== 'undefined') {
      if (token) localStorage.setItem('finbud_token', token)
      else localStorage.removeItem('finbud_token')
    }
    set({ token })
  },
  reset: () =>
    set({
      income: 0,
      expenses: 0,
      debts: [],
    }),
}))
