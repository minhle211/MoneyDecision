import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL ?? '/api'
const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('finbud_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export interface ProfilePayload {
  monthly_income?: number
  fixed_costs?: number
  current_savings?: number
  risk_score?: number
}

export interface GoalPayload {
  name: string
  goal_type: string
  target_amount: number
  target_months?: number
}

export interface GoalResponse {
  id: number
  name: string
  goal_type: string
  target_amount: number
  target_months?: number
}

export interface DebtPayload {
  name: string
  balance: number
  apr: number
  monthly_payment: number
}

export const authApi = {
  register: (email: string, password: string, display_name?: string) =>
    api.post('/v1/auth/register', { email, password, display_name }),
  login: (email: string, password: string) => {
    const form = new FormData()
    form.append('username', email)
    form.append('password', password)
    return api.post('/v1/auth/login', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  /** Exchange Firebase ID token for app JWT. Backend must have Firebase Admin configured. */
  firebaseLogin: (idToken: string) =>
    api.post<{ access_token: string }>('/v1/auth/firebase', { id_token: idToken }),
}

export const profileApi = {
  getMe: () => api.get('/v1/profile/me'),
  updateMe: (data: ProfilePayload) => api.put('/v1/profile/me', data),
  addDebt: (data: DebtPayload) => api.post('/v1/profile/debts', data),
  getPayoff: (debtId: number) => api.get(`/v1/profile/debts/${debtId}/payoff`),
  getAllocation: () => api.get('/v1/profile/allocation'),
  getProjection: (debtId: number) => api.get(`/v1/profile/projection/${debtId}`),
  getMentorNote: () => api.get<{ note: string }>('/v1/profile/mentor-note'),
  getGoals: () => api.get<GoalResponse[]>('/v1/profile/goals'),
  addGoal: (data: GoalPayload) => api.post<GoalResponse>('/v1/profile/goals', data),
  updateGoal: (goalId: number, data: Partial<GoalPayload>) => api.put<GoalResponse>(`/v1/profile/goals/${goalId}`, data),
  deleteGoal: (goalId: number) => api.delete(`/v1/profile/goals/${goalId}`),
}

export const scenariosApi = {
  debtExtra: (data: { debt_id: number; extra_monthly: number; months?: number }) =>
    api.post('/v1/scenarios/debt-extra', data),
  invest: (data: { monthly_amount: number; annual_return_pct?: number; months?: number }) =>
    api.post('/v1/scenarios/invest', data),
  savingRate: (data: {
    current_saving_rate_pct: number
    new_saving_rate_pct: number
    goal_id: number
    monthly_income: number
    current_savings: number
  }) => api.post('/v1/scenarios/saving-rate', data),
}

export default api
