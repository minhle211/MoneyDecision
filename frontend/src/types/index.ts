export interface Profile {
  id: number
  monthly_income: number | null
  fixed_costs: number | null
  risk_score: number | null
  debts: Debt[]
}

export interface Debt {
  id?: number
  name: string
  balance: number
  apr: number
  monthly_payment: number
}

export interface Allocation {
  needs: number
  wants: number
  savings: number
}

export interface ProjectionMonth {
  month: number
  balance: number
  interest: number
}

export interface MentorNoteResponse {
  note: string
}
