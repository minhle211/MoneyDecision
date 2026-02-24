import { create } from 'zustand'

export interface Debt {
  id?: number
  name: string
  balance: number
  apr: number
  monthly_payment: number
}

export interface Goal {
  id: number
  name: string
  goal_type: string
  target_amount: number
  target_months?: number
}

interface FinanceState {
  income: number
  expenses: number
  currentSavings: number
  debts: Debt[]
  goals: Goal[]
  token: string | null
  setProfile: (data: { income: number; expenses: number; currentSavings?: number }) => void
  addDebt: (newDebt: Debt) => void
  setDebts: (debts: Debt[]) => void
  setGoals: (goals: Goal[]) => void
  setToken: (token: string | null) => void
  reset: () => void
}

export const useFinanceStore = create<FinanceState>((set) => ({
  income: 0,
  expenses: 0,
  currentSavings: 0,
  debts: [],
  goals: [],
  token: typeof localStorage !== 'undefined' ? localStorage.getItem('finbud_token') : null,
  setProfile: (data) =>
    set({
      income: data.income,
      expenses: data.expenses,
      ...(data.currentSavings !== undefined && { currentSavings: data.currentSavings }),
    }),
  addDebt: (newDebt) =>
    set((state) => ({
      debts: [...state.debts, newDebt],
    })),
  setDebts: (debts) => set({ debts }),
  setGoals: (goals) => set({ goals }),
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
      currentSavings: 0,
      debts: [],
      goals: [],
    }),
}))
